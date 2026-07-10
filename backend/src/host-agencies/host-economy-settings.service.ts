import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateHostEconomySettingsDto } from "./dto/update-host-economy-settings.dto";

const SETTINGS_ID = "default";

@Injectable()
export class HostEconomySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.hostEconomySettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  }

  async updateSettings(dto: UpdateHostEconomySettingsDto) {
    await this.getSettings();
    return this.prisma.hostEconomySettings.update({
      where: { id: SETTINGS_ID },
      data: dto,
    });
  }
}
