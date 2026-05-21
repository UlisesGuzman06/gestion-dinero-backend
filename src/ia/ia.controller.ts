import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IaService, SmartInputResult } from './ia.service';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @UseGuards(AuthGuard)
  @Post('smart-input')
  async parseText(@Body('text') text: string): Promise<SmartInputResult> {
    return this.iaService.parseText(text);
  }
}
