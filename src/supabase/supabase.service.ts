import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('CRITICAL: Supabase URL or Key is missing in environment variables!');
      console.error('URL present:', !!supabaseUrl);
      console.error('Key present:', !!supabaseKey);
      throw new Error('Supabase URL and Key must be provided in .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getAdminClient() {
    const supabaseUrl = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Admin features disabled.');
      return null;
    }
    
    return createClient(supabaseUrl!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  getClient() {
    return this.supabase;
  }

  getClientForUser(token: string) {
    const supabaseUrl = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    // Devolvemos un cliente con el token del usuario
    return createClient(supabaseUrl!, supabaseKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
}
