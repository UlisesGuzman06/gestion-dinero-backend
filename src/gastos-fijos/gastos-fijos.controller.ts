import { Controller, Get, Post, Body, Delete, Param, Patch } from '@nestjs/common';
import { GastosFijosService } from './gastos-fijos.service';

@Controller('gastos-fijos')
export class GastosFijosController {
  constructor(private readonly gastosFijosService: GastosFijosService) {}

  @Get()
  findAll() {
    return this.gastosFijosService.findAll();
  }

  @Post()
  create(@Body() data: { nombre: string; monto: number; link?: string }) {
    return this.gastosFijosService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gastosFijosService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.gastosFijosService.update(id, updateData);
  }
}
