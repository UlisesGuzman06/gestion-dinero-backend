import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class InversionesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(token?: string) {
    const client = token ? this.supabase.getClientForUser(token) : this.supabase.getClient();
    const { data, error } = await client
      .from('inversiones')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
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
