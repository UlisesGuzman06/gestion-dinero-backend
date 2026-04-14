import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @UseGuards(AuthGuard)
  @Get()
  getSummary(@Req() req: any) {
    return this.balanceService.getSummary(req.token);
  }
}
