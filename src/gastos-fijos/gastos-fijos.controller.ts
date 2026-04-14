import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { GastosFijosService } from './gastos-fijos.service';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('gastos-fijos')
export class GastosFijosController {
  constructor(private readonly gastosFijosService: GastosFijosService) {}

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.gastosFijosService.findAll(req.token);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() data: { nombre: string; monto: number; link?: string }, @Req() req: any) {
    return this.gastosFijosService.create(data, req.token);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.gastosFijosService.remove(id, req.token);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    return this.gastosFijosService.update(id, updateData, req.token);
  }
}
