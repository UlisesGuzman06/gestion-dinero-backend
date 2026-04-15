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
          criteria: 'desc',
          limit: 50
        }
      });

      const transactions = (searchResult.results || []).map(p => {
        // En MP, casi todos los montos son positivos. 
        // Si el estado es 'approved' y tiene un monto neto positivo, es ingreso.
        // Pero para simplificar: si el p.operation_type es 'money_transfer' y p.transaction_amount es positivo,
        // dependemos de si somos el pagador o receptor.
        // Simplificación: si p.transaction_amount > 0 y no es un gasto explícito, es ingreso.
        
        let tipo = 'gasto';
        if (p.operation_type === 'regular_payment' || p.operation_type === 'pos_payment' || p.operation_type === 'money_transfer') {
             // Si el monto es positivo y el estado es approved, lo tratamos como ingreso si 
             // el monto llega a nuestra cuenta.
             // Para esta app, asumiremos que si aparece aquí es porque impacta nuestra cuenta.
             tipo = p.transaction_amount > 0 ? 'ingreso' : 'gasto';
        }

        return {
          id: (p.id || '').toString(),
          fecha: p.date_created,
          monto: p.transaction_amount || 0,
          descripcion: p.description || `Pago ${p.operation_type}`,
          tipo: tipo,
          plataforma: 'mercadopago',
          estado: p.status
        };
      });

      this.logger.log(`Found ${transactions.length} MP transactions`);
      return transactions;
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
