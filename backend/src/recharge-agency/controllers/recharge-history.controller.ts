import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { RechargeChargeService } from "../recharge-charge.service";

@ApiTags("wallet")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("wallet")
export class RechargeHistoryController {
  constructor(private readonly chargeService: RechargeChargeService) {}

  @Get("recharge-history")
  listMyRechargeHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.chargeService.listTransactions(undefined, user.id);
  }
}
