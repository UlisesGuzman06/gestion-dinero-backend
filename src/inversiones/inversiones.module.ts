import { Module } from '@nestjs/common';
import { InversionesService } from './inversiones.service';
import { InversionesController } from './inversiones.controller';

@Module({
  providers: [InversionesService],
  controllers: [InversionesController]
})
export class InversionesModule {}
