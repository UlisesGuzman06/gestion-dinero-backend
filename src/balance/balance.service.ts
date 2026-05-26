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

  async getSummary(token?: string, yearParam?: number, monthParam?: number) {
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
      const targetYear = yearParam !== undefined ? yearParam : now.getFullYear();
      const targetMonth = monthParam !== undefined ? monthParam : now.getMonth();

      // Totales históricos para el balance acumulado disponible
      const totalIngresosLifetime = (ingresosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalGastosVariablesLifetime = (gastosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalGastosFijos = (fijosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
      const totalInvertidoReal = (inversionesData || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

      const totalGastosLifetime = totalGastosVariablesLifetime + totalGastosFijos;
      const balanceActual = totalIngresosLifetime - totalGastosLifetime - totalInvertidoReal;

      let totalIngresos: number;
      let totalADestinarInversion: number;
      let totalGastosVariables: number;
      let totalGastos: number;

      if (yearParam === undefined || monthParam === undefined) {
        // Histórico acumulado (todos los meses)
        totalIngresos = totalIngresosLifetime;
        totalADestinarInversion = (ingresosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto_invertir || 0), 0);
        totalGastosVariables = totalGastosVariablesLifetime;
        totalGastos = totalGastosVariables + totalGastosFijos;

        this.logger.log(`Balance Calculado Histórico: Disponible(${balanceActual}) | Ingresos(${totalIngresos}), Gastos(${totalGastos}), Sugerido Inv(${totalADestinarInversion})`);
      } else {
        // Extracción de año/mes timezone-safe basada en cadenas (evita desfasajes en días límite)
        const getYearAndMonth = (dateStr: string) => {
          const parts = dateStr.split('T')[0].split('-');
          return {
            year: parseInt(parts[0], 10),
            month: parseInt(parts[1], 10) - 1,
          };
        };

        // Filtrado por período para las tarjetas mensuales
        const ingresosMes = (ingresosRes.data || []).filter(item => {
          if (!item.fecha) return false;
          const { year, month } = getYearAndMonth(item.fecha);
          return year === targetYear && month === targetMonth;
        });

        const gastosMes = (gastosRes.data || []).filter(item => {
          if (!item.fecha) return false;
          const { year, month } = getYearAndMonth(item.fecha);
          return year === targetYear && month === targetMonth;
        });

        totalIngresos = ingresosMes.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
        totalADestinarInversion = ingresosMes.reduce((acc, curr) => acc + Number(curr.monto_invertir || 0), 0);
        totalGastosVariables = gastosMes.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
        totalGastos = totalGastosVariables + totalGastosFijos;

        this.logger.log(`Balance Calculado: Disponible(${balanceActual}) | Periodo ${targetYear}-${targetMonth + 1}: Ingresos(${totalIngresos}), Gastos(${totalGastos}), Sugerido Inv(${totalADestinarInversion})`);
      }

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
