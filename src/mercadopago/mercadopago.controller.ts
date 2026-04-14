import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mpService: MercadoPagoService) {}

  @UseGuards(AuthGuard)
  @Post('create-preference')
  async createPreference(
    @Body('title') title: string,
    @Body('amount') amount: number,
  ) {
    return this.mpService.createPreference(title, amount);
  }
}
