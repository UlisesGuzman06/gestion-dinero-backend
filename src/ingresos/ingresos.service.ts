import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';

@Injectable()
export class IngresosService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createIngresoDto: CreateIngresoDto) {
    const { monto, descripcion, fecha } = createIngresoDto;
    const client = this.supabase.getClient();
    
    // Lógica del 15% para inversión
    const monto_invertir = monto * 0.15;

    const { data, error } = await client
      .from('ingresos')
      .insert([
        {
          monto,
          descripcion,
          fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
          monto_invertir,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll() {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('ingresos')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('ingresos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, updateData: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('ingresos')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
  }
}
