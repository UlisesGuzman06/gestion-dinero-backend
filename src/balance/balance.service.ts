import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { InversionesService } from '../inversiones/inversiones.service';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly inversionesService: InversionesService,
  ) {}

  async getSummary(token?: string) {
    const client = token ? this.supabase.getClientForUser(token) : this.supabase.getClient();

    try {
      // Consultamos todas las tablas locales
      const [ingresosRes, gastosRes, inversionesData, fijosRes] = await Promise.all([
        client.from('ingresos').select('monto, monto_invertir, fecha'),
        client.from('gastos').select('monto, fecha'),
        this.inversionesService.findAll(token),
        client.from('gastos_fijos').select('monto'),
      ]);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Totales históricos para el balance acumulado disponible
      const totalIngresosLifetime = (ingresosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalGastosVariablesLifetime = (gastosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalGastosFijos = (fijosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalInvertidoReal = (inversionesData || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

      const totalGastosLifetime = totalGastosVariablesLifetime + totalGastosFijos;
      const balanceActual = totalIngresosLifetime - totalGastosLifetime - totalInvertidoReal;

      // Filtrado por mes actual para las tarjetas mensuales
      const ingresosMes = (ingresosRes.data || []).filter(item => {
        if (!item.fecha) return false;
        const d = new Date(item.fecha);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });

      const gastosMes = (gastosRes.data || []).filter(item => {
        if (!item.fecha) return false;
        const d = new Date(item.fecha);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });

      const totalIngresos = ingresosMes.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalADestinarInversion = ingresosMes.reduce((acc, curr) => acc + Number(curr.monto_invertir || 0), 0);
      const totalGastosVariables = gastosMes.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalGastos = totalGastosVariables + totalGastosFijos;

      this.logger.log(`Balance Calculado: Disponible(${balanceActual}) | Mes actual: Ingresos(${totalIngresos}), Gastos(${totalGastos}), Sugerido Inv(${totalADestinarInversion})`);

      return {
        balanceActual,
        totalIngresos,
        totalGastos,
        totalGastosVariables,
        totalGastosFijos,
        totalADestinarInversion,
        totalInvertidoReal
      };
    } catch (error) {
      this.logger.error('Error calculando balance:', error);
      throw error;
    }
  }
}
