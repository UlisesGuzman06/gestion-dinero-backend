import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

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

  async getTransactions(monthsCount: number = 1) {
    try {
      const payment = new Payment(this.client);
      
      const now = new Date();
      const beginDate = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
      
      this.logger.log(`Fetching MP transactions from ${beginDate.toISOString()}`);

      const searchResult = await payment.search({
        options: {
          begin_date: beginDate.toISOString(),
          end_date: now.toISOString(),
          sort: 'date_created',
          criteria: 'desc'
        }
      });

      return (searchResult.results || []).map(p => ({
        id: (p.id || '').toString(),
        fecha: p.date_created,
        monto: p.transaction_amount || 0,
        descripcion: p.description || 'Transacción Mercado Pago',
        tipo: p.operation_type === 'regular_payment' ? ((p.transaction_amount || 0) > 0 ? 'ingreso' : 'gasto') : 'otros',
        plataforma: 'mercadopago',
        estado: p.status
      }));
    } catch (error) {
      this.logger.error('Error fetching Mercado Pago transactions:', error);
      return [];
    }
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
      if (error.response) {
        this.logger.error('MP Error Response:', JSON.stringify(error.response, null, 2));
      }
      throw error;
    }
  }
}
