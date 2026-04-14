import { Controller, Post, Body } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mpService: MercadoPagoService) {}

  @Post('create-preference')
  async createPreference(
    @Body('title') title: string,
    @Body('amount') amount: number,
  ) {
    return this.mpService.createPreference(title, amount);
  }
}
