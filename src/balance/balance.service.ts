import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getSummary() {
    const client = this.supabase.getClient();

    try {
      // Consultamos todas las tablas
      const [ingresosRes, gastosRes, inversionesRes, fijosRes] = await Promise.all([
        client.from('ingresos').select('monto, monto_invertir'),
        client.from('gastos').select('monto'),
        client.from('inversiones').select('monto'),
        client.from('gastos_fijos').select('monto'),
      ]);

      const totalIngresos = (ingresosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalADestinarInversion = (ingresosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto_invertir || 0), 0);
      
      const totalGastosVariables = (gastosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalGastosFijos = (fijosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      
      const totalInvertidoReal = (inversionesRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

      // CÁLCULO FINAL: Ingresos - (Gastos Variables + Gastos Fijos) - Inversiones
      const totalGastos = totalGastosVariables + totalGastosFijos;
      const balanceActual = totalIngresos - totalGastos - totalInvertidoReal;

      this.logger.log(`Balance Actualizado: Ingresos(${totalIngresos}) - GastosFijos(${totalGastosFijos}) - GastosVar(${totalGastosVariables}) - Inv(${totalInvertidoReal}) = ${balanceActual}`);

      return {
        balanceActual,
        totalIngresos,
        totalGastos,
        totalGastosVariables,
        totalGastosFijos,
        totalADestinarInversion,
        totalInvertidoReal,
      };
    } catch (error) {
      this.logger.error('Error calculando balance:', error);
      throw error;
    }
  }
}
