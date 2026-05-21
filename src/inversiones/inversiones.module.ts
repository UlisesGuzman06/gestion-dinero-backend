import { Module } from '@nestjs/common';
import { InversionesService } from './inversiones.service';
import { InversionesController } from './inversiones.controller';

import { CotizacionesModule } from '../cotizaciones/cotizaciones.module';

@Module({
  imports: [CotizacionesModule],
  providers: [InversionesService],
  controllers: [InversionesController],
  exports: [InversionesService],
})
export class InversionesModule {}
