import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @UseGuards(AuthGuard)
  @Get()
  getSummary(
    @Req() req: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = year ? parseInt(year, 10) : undefined;
    const m = month ? parseInt(month, 10) - 1 : undefined; // Convierte mes de 1-indexed (query) a 0-indexed (JS)
    return this.balanceService.getSummary(req.token, y, m);
  }
}
