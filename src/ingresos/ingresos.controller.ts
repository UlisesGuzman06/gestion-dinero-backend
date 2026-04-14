import { Controller, Get, Post, Body, Delete, Param, Patch } from '@nestjs/common';
import { IngresosService } from './ingresos.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';

@Controller('ingresos')
export class IngresosController {
  constructor(private readonly ingresosService: IngresosService) {}

  @Post()
  create(@Body() createIngresoDto: CreateIngresoDto) {
    return this.ingresosService.create(createIngresoDto);
  }

  @Get()
  findAll() {
    return this.ingresosService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ingresosService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.ingresosService.update(id, updateData);
  }
}
