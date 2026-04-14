import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('EMAIL_PORT', 587),
      secure: false, 
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  // Se ejecuta todos los días a las 09:00 AM
  @Cron('0 0 9 * * *')
  async handleMonthlyReminder() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Si mañana es día 1, hoy es el último día del mes
    if (tomorrow.getDate() === 1) {
      this.logger.log('Iniciando envío de recordatorios mensuales...');
      await this.sendReminders();
    }
  }

  async sendReminders() {
    const adminClient = this.supabaseService.getAdminClient();
    if (!adminClient) {
      this.logger.error('No se pudo obtener el cliente Admin de Supabase');
      return;
    }

    // Obtenemos todos los usuarios del sistema de auth
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();

    if (error) {
       this.logger.error('Error al listar usuarios:', error);
       return;
    }

    const appUrl = this.configService.get('APP_URL', 'https://gestion-dinero-front.vercel.app');

    for (const user of users) {
      if (!user.email) continue;

      try {
        await this.transporter.sendMail({
          from: `"PLATA - Gestión Financiera" <${this.configService.get('EMAIL_USER')}>`,
          to: user.email,
          subject: '💰 Recordatorio de Pagos - Fin de Mes',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 20px;">
              <h1 style="color: #1d4ed8; text-align: center; font-style: italic; font-weight: 900; letter-spacing: -2px;">PLATA</h1>
              <p style="text-align: center; font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;">Gestión Patrimonial</p>
              
              <div style="margin-top: 40px; text-align: center;">
                <h2 style="color: #111827;">¡Es fin de mes!</h2>
                <p style="color: #4b5563; line-height: 1.6;">Es momento de revisar tus gastos fijos y dejar tus cuentas al día.</p>
                
                <a href="${appUrl}" style="display: inline-block; background-color: #1d4ed8; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Entrar a mi Bóveda</a>
              </div>
              
              <p style="margin-top: 50px; text-align: center; font-size: 9px; color: #9ca3af; text-transform: uppercase; font-weight: bold;">Pure Silver Architecture 2026</p>
            </div>
          `,
        });
        this.logger.log(`Email enviado con éxito a: ${user.email}`);
      } catch (err) {
        this.logger.error(`Fallo al enviar email a ${user.email}:`, err);
      }
    }
  }

  // Método de prueba (puedes llamarlo manualmente para validar)
  async debugSendOne(email: string) {
      this.logger.log(`Enviando prueba a ${email}...`);
      // Lógica de envío simplificada
  }
}
