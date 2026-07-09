import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHostAgencyDto } from "./dto/create-host-agency.dto";
import { UpdateHostAgencyDto } from "./dto/update-host-agency.dto";

const AGENCY_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  owner: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
  _count: { select: { members: true } },
};

const MEMBER_SELECT = {
  id: true,
  userId: true,
  role: true,
  joinedAt: true,
  user: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
};

@Injectable()
export class HostAgenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAgencies() {
    return this.prisma.hostAgency.findMany({
      where: { isActive: true },
      select: AGENCY_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async getMyMembership(userId: string) {
    const membership = await this.prisma.hostAgencyMember.findUnique({
      where: { userId },
      include: { agency: { select: AGENCY_SELECT } },
    });
    return membership;
  }

  async getAgencyDetail(agencyId: string) {
    const agency = await this.prisma.hostAgency.findUnique({
      where: { id: agencyId },
      select: { ...AGENCY_SELECT, members: { select: MEMBER_SELECT, orderBy: { joinedAt: "asc" } } },
    });
    if (!agency) {
      throw new NotFoundException("Host agency not found");
    }
    return agency;
  }

  async createAgency(userId: string, dto: CreateHostAgencyDto) {
    const existing = await this.prisma.hostAgencyMember.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException("You are already a member of a host agency");
    }

    return this.prisma.$transaction(async (tx) => {
      const agency = await tx.hostAgency.create({
        data: { name: dto.name, description: dto.description, ownerId: userId },
      });
      await tx.hostAgencyMember.create({
        data: { agencyId: agency.id, userId, role: "OWNER" },
      });
      return tx.hostAgency.findUnique({ where: { id: agency.id }, select: AGENCY_SELECT });
    });
  }

  async joinAgency(userId: string, agencyId: string) {
    const existing = await this.prisma.hostAgencyMember.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException("You are already a member of a host agency");
    }

    const agency = await this.prisma.hostAgency.findUnique({ where: { id: agencyId } });
    if (!agency || !agency.isActive) {
      throw new NotFoundException("Host agency not found");
    }

    await this.prisma.hostAgencyMember.create({
      data: { agencyId, userId, role: "HOST" },
    });
    return this.getAgencyDetail(agencyId);
  }

  async leaveAgency(userId: string) {
    const membership = await this.prisma.hostAgencyMember.findUnique({ where: { userId } });
    if (!membership) {
      throw new NotFoundException("You are not a member of any host agency");
    }

    if (membership.role === "OWNER") {
      // Leaving as the owner dissolves the agency entirely (cascades to remaining members).
      await this.prisma.hostAgency.delete({ where: { id: membership.agencyId } });
      return { dissolved: true };
    }

    await this.prisma.hostAgencyMember.delete({ where: { userId } });
    return { dissolved: false };
  }

  async updateAgency(userId: string, agencyId: string, dto: UpdateHostAgencyDto) {
    await this.assertIsOwner(userId, agencyId);
    return this.prisma.hostAgency.update({
      where: { id: agencyId },
      data: { name: dto.name, description: dto.description },
      select: AGENCY_SELECT,
    });
  }

  async dissolveAgency(userId: string, agencyId: string) {
    await this.assertIsOwner(userId, agencyId);
    await this.prisma.hostAgency.delete({ where: { id: agencyId } });
    return { dissolved: true };
  }

  async kickMember(userId: string, agencyId: string, targetUserId: string) {
    await this.assertIsOwner(userId, agencyId);
    if (targetUserId === userId) {
      throw new ForbiddenException("Use leave to remove yourself; owners cannot kick themselves");
    }

    const target = await this.prisma.hostAgencyMember.findUnique({ where: { userId: targetUserId } });
    if (!target || target.agencyId !== agencyId) {
      throw new NotFoundException("This user is not a member of your agency");
    }

    await this.prisma.hostAgencyMember.delete({ where: { userId: targetUserId } });
    return this.getAgencyDetail(agencyId);
  }

  private async assertIsOwner(userId: string, agencyId: string) {
    const agency = await this.prisma.hostAgency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      throw new NotFoundException("Host agency not found");
    }
    if (agency.ownerId !== userId) {
      throw new ForbiddenException("Only the agency owner can perform this action");
    }
  }
}
