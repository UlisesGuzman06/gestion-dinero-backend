import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

import { InversionesModule } from '../inversiones/inversiones.module';

@Module({
  imports: [InversionesModule],
  controllers: [BalanceController],
  providers: [BalanceService]
})
export class BalanceModule {}
