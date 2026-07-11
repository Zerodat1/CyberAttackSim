import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateCommissionSettingsDto } from "./dto/update-commission-settings.dto";

const SETTINGS_ID = "default";

@Injectable()
export class RechargeSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.commissionSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  }

  async updateSettings(dto: UpdateCommissionSettingsDto) {
    await this.getSettings();
    return this.prisma.commissionSettings.update({
      where: { id: SETTINGS_ID },
      data: dto,
    });
  }
}
