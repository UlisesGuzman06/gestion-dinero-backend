import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngresosModule } from './ingresos/ingresos.module';
import { GastosModule } from './gastos/gastos.module';
import { BalanceModule } from './balance/balance.module';
import { SupabaseModule } from './supabase/supabase.module';
import { InversionesModule } from './inversiones/inversiones.module';
import { GastosFijosModule } from './gastos-fijos/gastos-fijos.module';
import { MercadoPagoModule } from './mercadopago/mercadopago.module';

import { ScheduleModule } from '@nestjs/schedule';

import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SupabaseModule,
    IngresosModule,
    GastosModule,
    BalanceModule,
    InversionesModule,
    GastosFijosModule,
    MercadoPagoModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
