import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createGastoDto: CreateGastoDto, @Req() req: any) {
    return this.gastosService.create(createGastoDto, req.token);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.gastosService.findAll(req.token);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.gastosService.remove(id, req.token);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    return this.gastosService.update(id, updateData, req.token);
  }
}
