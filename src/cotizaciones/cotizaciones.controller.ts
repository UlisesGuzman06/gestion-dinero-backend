import { Controller, Get, UseGuards } from '@nestjs/common';
import { CotizacionesService } from './cotizaciones.service';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getCotizaciones() {
    return this.cotizacionesService.getCotizaciones();
  }
}
