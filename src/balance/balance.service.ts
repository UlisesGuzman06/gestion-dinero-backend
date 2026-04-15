import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly mpService: MercadoPagoService,
  ) {}

  async getSummary(token?: string) {
    const client = token ? this.supabase.getClientForUser(token) : this.supabase.getClient();

    try {
      // Consultamos todas las tablas locales
      const [ingresosRes, gastosRes, inversionesRes, fijosRes, mpTransactions] = await Promise.all([
        client.from('ingresos').select('monto, monto_invertir'),
        client.from('gastos').select('monto'),
        client.from('inversiones').select('monto'),
        client.from('gastos_fijos').select('monto'),
        this.mpService.getTransactions(1), // Historial del mes actual
      ]);

      const totalIngresosLocal = (ingresosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalADestinarInversion = (ingresosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto_invertir || 0), 0);
      
      const totalGastosVariablesLocal = (gastosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalGastosFijos = (fijosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      
      const totalInvertidoReal = (inversionesRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

      // Integrar Mercado Pago
      const mpIngresos = mpTransactions
        .filter(t => t.tipo === 'ingreso' && t.estado === 'approved')
        .reduce((acc, t) => acc + (t.monto || 0), 0);
      
      const mpGastos = mpTransactions
        .filter(t => t.tipo === 'gasto' && t.estado === 'approved')
        .reduce((acc, t) => acc + Math.abs(t.monto || 0), 0);

      const totalIngresos = totalIngresosLocal + mpIngresos;
      const totalGastosVariables = totalGastosVariablesLocal + mpGastos;

      // CÁLCULO FINAL: Ingresos - (Gastos Variables + Gastos Fijos) - Inversiones
      const totalGastos = totalGastosVariables + totalGastosFijos;
      const balanceActual = totalIngresos - totalGastos - totalInvertidoReal;

      this.logger.log(`Balance Actualizado (inc. MP): Ingresos(${totalIngresos}) - GastosFijos(${totalGastosFijos}) - GastosVar(${totalGastosVariables}) - Inv(${totalInvertidoReal}) = ${balanceActual}`);

      return {
        balanceActual,
        totalIngresos,
        totalGastos,
        totalGastosVariables,
        totalGastosFijos,
        totalADestinarInversion,
        totalInvertidoReal,
        mpSummary: {
          ingresos: mpIngresos,
          gastos: mpGastos,
          count: mpTransactions.length
        }
      };
    } catch (error) {
      this.logger.error('Error calculando balance:', error);
      throw error;
    }
  }
}
