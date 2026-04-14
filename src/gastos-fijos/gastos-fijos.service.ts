import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class GastosFijosService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll() {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('gastos_fijos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  async create(data: { nombre: string; monto: number; link?: string }) {
    const client = this.supabase.getClient();
    const { data: result, error } = await client
      .from('gastos_fijos')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  }

  async remove(id: string) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('gastos_fijos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async update(id: string, updateData: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('gastos_fijos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
