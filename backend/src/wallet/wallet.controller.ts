import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../common/types/authenticated-user";
import { WalletService } from "./wallet.service";
import { RechargePackagesService } from "../recharge-agency/recharge-packages.service";

@ApiTags("wallet")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("wallet")
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly packagesService: RechargePackagesService,
  ) {}

  @Get("me")
  getMyWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getOrCreateWallet(user.id);
  }

  @Get("packages")
  listPackages() {
    return this.packagesService.listActive();
  }
}
