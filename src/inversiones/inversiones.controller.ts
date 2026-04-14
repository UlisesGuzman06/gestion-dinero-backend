import { Controller, Get, Post, Body, Delete, Param, Patch } from '@nestjs/common';
import { InversionesService } from './inversiones.service';

@Controller('inversiones')
export class InversionesController {
  constructor(private readonly inversionesService: InversionesService) {}

  @Get()
  findAll() {
    return this.inversionesService.findAll();
  }

  @Post()
  create(@Body() data: { monto: number; descripcion: string; fecha?: Date }) {
    return this.inversionesService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inversionesService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.inversionesService.update(id, updateData);
  }
}
