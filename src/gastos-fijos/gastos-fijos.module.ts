import { Module } from '@nestjs/common';
import { GastosFijosService } from './gastos-fijos.service';
import { GastosFijosController } from './gastos-fijos.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [GastosFijosController],
  providers: [GastosFijosService],
})
export class GastosFijosModule {}
