import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CotizacionesService } from '../cotizaciones/cotizaciones.service';

@Injectable()
export class InversionesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly cotizacionesService: CotizacionesService,
  ) {}

  async findAll(token?: string) {
    const client = token ? this.supabase.getClientForUser(token) : this.supabase.getClient();
    const { data, error } = await client
      .from('inversiones')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw new Error(error.message);
    if (!data) return [];

    let cotizaciones: any = null;
    try {
      cotizaciones = await this.cotizacionesService.getCotizaciones();
    } catch (e) {
      cotizaciones = null;
    }

    return data.map((inv: any) => {
      try {
        if (inv.descripcion && inv.descripcion.startsWith('{')) {
          const parsed = JSON.parse(inv.descripcion);
          if (parsed.isCrypto && parsed.symbol && parsed.qty && cotizaciones) {
            const sym = parsed.symbol.toLowerCase();
            const cryptoData = cotizaciones.cryptos[sym];
            if (cryptoData) {
              const currentPriceArs = cryptoData.ars;
              const currentPriceUsd = cryptoData.usd;
              const buyPrice = parsed.buyPrice || 0;
              const qty = parsed.qty;
              
              const montoActualArs = qty * currentPriceArs;
              const montoActualUsd = qty * currentPriceUsd;
              const totalBuyUsd = qty * buyPrice;
              const rendimientoUsd = montoActualUsd - totalBuyUsd;
              const roi = totalBuyUsd > 0 ? (rendimientoUsd / totalBuyUsd) * 100 : 0;

              return {
                ...inv,
                monto: montoActualArs, // Reemplazar con el monto actual dinámico en ARS
                descripcion: parsed.label || `Inversión ${parsed.symbol.toUpperCase()}`,
                isAdvanced: true,
                cryptoDetails: {
                  symbol: parsed.symbol.toUpperCase(),
                  qty,
                  buyPrice,
                  currentPriceUsd,
                  montoActualUsd,
                  montoActualArs,
                  rendimientoUsd,
                  roi,
                  label: parsed.label || `Inversión ${parsed.symbol.toUpperCase()}`
                }
              };
            }
          }
        }
      } catch (err) {
        // Si hay error al parsear JSON, se retorna el item tal cual
      }
      return inv;
    });
  }

  async create(createData: { monto: number; descripcion: string; fecha?: Date }, token?: string) {
    const client = token ? this.supabase.getClientForUser(token) : this.supabase.getClient();
    const { data, error } = await client
      .from('inversiones')
      .insert([
        {
          monto: createData.monto,
          descripcion: createData.descripcion,
          fecha: createData.fecha ? new Date(createData.fecha).toISOString() : new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string, token?: string) {
    const client = token ? this.supabase.getClientForUser(token) : this.supabase.getClient();
    const { data, error } = await client
      .from('inversiones')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, updateData: any, token?: string) {
    const client = token ? this.supabase.getClientForUser(token) : this.supabase.getClient();
    const { data, error } = await client
      .from('inversiones')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
  }
}
