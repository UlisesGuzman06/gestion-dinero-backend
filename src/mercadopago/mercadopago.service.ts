import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
    
    this.client = new MercadoPagoConfig({
      accessToken: accessToken || 'TEST-YOUR-ACCESS-TOKEN',
    });
  }

  async createPreference(title: string, amount: number) {
    try {
      const preference = new Preference(this.client);
      
      const response = await preference.create({
        body: {
          items: [
            {
              id: 'payment-item',
              title: title,
              unit_price: Number(amount),
              quantity: 1,
              currency_id: 'ARS',
            },
          ],
          back_urls: {
            success: 'http://localhost:8001',
            failure: 'http://localhost:8001',
            pending: 'http://localhost:8001',
          },
        },
      });

      return {
        init_point: response.init_point,
        id: response.id,
      };
    } catch (error) {
      this.logger.error('Error creating Mercado Pago preference:', error);
      throw error;
    }
  }
}
