import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateGastoDto } from './dto/create-gasto.dto';

@Injectable()
export class GastosService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createGastoDto: CreateGastoDto) {
    const { monto, descripcion, categoria, fecha } = createGastoDto;
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('gastos')
      .insert([
        {
          monto,
          descripcion,
          categoria,
          fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
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
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, updateData: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('gastos')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
  }
}
