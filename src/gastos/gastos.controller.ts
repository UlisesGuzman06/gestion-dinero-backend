import { Controller, Get, Post, Body, Delete, Param, Patch } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { CreateGastoDto } from './dto/create-gasto.dto';

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  create(@Body() createGastoDto: CreateGastoDto) {
    return this.gastosService.create(createGastoDto);
  }

  @Get()
  findAll() {
    return this.gastosService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gastosService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.gastosService.update(id, updateData);
  }
}
