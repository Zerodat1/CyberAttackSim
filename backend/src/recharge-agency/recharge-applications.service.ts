import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationReviewAction, ReviewApplicationDto } from "./dto/review-application.dto";
import { RechargeSettingsService } from "./recharge-settings.service";

@Injectable()
export class RechargeApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly settings: RechargeSettingsService,
  ) {}

  async apply(applicantId: string, dto: CreateApplicationDto) {
    const existing = await this.prisma.rechargeAgencyApplication.findUnique({
      where: { applicantId },
    });

    if (existing && existing.status !== "CHANGES_REQUESTED") {
      throw new ConflictException("An application already exists for this account");
    }

    if (existing && existing.status === "CHANGES_REQUESTED") {
      return this.prisma.rechargeAgencyApplication.update({
        where: { id: existing.id },
        data: {
          ...dto,
          socialLinks: (dto.socialLinks ?? undefined) as Prisma.InputJsonValue,
          status: ApplicationStatus.PENDING,
          reviewedById: null,
          reviewNotes: null,
          reviewedAt: null,
        },
      });
    }

    return this.prisma.rechargeAgencyApplication.create({
      data: {
        applicantId,
        ...dto,
        socialLinks: (dto.socialLinks ?? undefined) as Prisma.InputJsonValue,
      },
    });
  }

  async getMine(applicantId: string) {
    const application = await this.prisma.rechargeAgencyApplication.findUnique({
      where: { applicantId },
    });
    if (!application) {
      throw new NotFoundException("No recharge agency application found");
    }
    return application;
  }

  async list(status?: ApplicationStatus) {
    return this.prisma.rechargeAgencyApplication.findMany({
      where: status ? { status } : undefined,
      include: { applicant: { select: { id: true, username: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async review(applicationId: string, reviewerId: string, dto: ReviewApplicationDto) {
    const application = await this.prisma.rechargeAgencyApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    switch (dto.action) {
      case ApplicationReviewAction.APPROVE:
        return this.approve(application.id, application.applicantId, reviewerId, dto.notes);
      case ApplicationReviewAction.REJECT:
        return this.setStatus(
          application.id,
          ApplicationStatus.REJECTED,
          reviewerId,
          dto.notes,
          application.applicantId,
          "APPLICATION_REJECTED",
          "تم رفض طلب فتح الوكالة",
          dto.notes ?? "تم رفض طلبك لفتح وكالة شحن.",
        );
      case ApplicationReviewAction.REQUEST_CHANGES:
        return this.setStatus(
          application.id,
          ApplicationStatus.CHANGES_REQUESTED,
          reviewerId,
          dto.notes,
          application.applicantId,
          "APPLICATION_CHANGES_REQUESTED",
          "مطلوب تعديل بيانات الطلب",
          dto.notes ?? "يرجى تعديل بيانات طلبك وإعادة الإرسال.",
        );
      case ApplicationReviewAction.SUSPEND:
        if (application.status !== ApplicationStatus.APPROVED) {
          throw new BadRequestException("Only approved applications can be suspended");
        }
        await this.prisma.rechargeAgency.updateMany({
          where: { applicationId: application.id },
          data: { status: "SUSPENDED" },
        });
        await this.prisma.rechargeAgent.updateMany({
          where: { agency: { applicationId: application.id } },
          data: { status: "SUSPENDED" },
        });
        return this.setStatus(
          application.id,
          ApplicationStatus.SUSPENDED,
          reviewerId,
          dto.notes,
          application.applicantId,
          "APPLICATION_SUSPENDED",
          "تم تعليق الوكالة",
          dto.notes ?? "تم تعليق وكالتك من قبل الإدارة.",
        );
      default:
        throw new BadRequestException("Unsupported review action");
    }
  }

  private async setStatus(
    applicationId: string,
    status: ApplicationStatus,
    reviewerId: string,
    notes: string | undefined,
    applicantId: string,
    notificationType: Parameters<NotificationsService["send"]>[1],
    title: string,
    body: string,
  ) {
    const updated = await this.prisma.rechargeAgencyApplication.update({
      where: { id: applicationId },
      data: { status, reviewedById: reviewerId, reviewNotes: notes, reviewedAt: new Date() },
    });

    await this.notifications.send(applicantId, notificationType, title, body);

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: `application.${status.toLowerCase()}`,
        entityType: "RechargeAgencyApplication",
        entityId: applicationId,
      },
    });

    return updated;
  }

  private async approve(
    applicationId: string,
    applicantId: string,
    reviewerId: string,
    notes: string | undefined,
  ) {
    const settings = await this.settings.getSettings();

    const result = await this.prisma.$transaction(async (tx) => {
      const application = await tx.rechargeAgencyApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedById: reviewerId,
          reviewNotes: notes,
          reviewedAt: new Date(),
        },
      });

      const agency = await tx.rechargeAgency.create({
        data: {
          applicationId: application.id,
          name: application.agencyName,
          country: application.country,
          city: application.city,
          ownerId: applicantId,
          commissionRate: settings.agencyCommissionRate,
        },
      });

      const agent = await tx.rechargeAgent.create({
        data: {
          userId: applicantId,
          agencyId: agency.id,
          role: "MASTER",
          commissionRate: settings.agentCommissionRate,
        },
      });

      await tx.rechargeWallet.create({
        data: { ownerType: "AGENT", agentId: agent.id, balance: 0 },
      });

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: "application.approved",
          entityType: "RechargeAgencyApplication",
          entityId: application.id,
          metadata: { agencyId: agency.id, agentId: agent.id },
        },
      });

      return { application, agency, agent };
    });

    await this.notifications.send(
      applicantId,
      "APPLICATION_APPROVED",
      "تمت الموافقة على طلب وكالتك",
      "تهانينا! تمت الموافقة على طلبك، وتم إنشاء وكالتك ومحفظتك الخاصة. قم بشراء رصيد للبدء بالشحن.",
      { agencyId: result.agency.id },
    );

    return result.application;
  }
}
