import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { IngresosService } from './ingresos.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('ingresos')
export class IngresosController {
  constructor(private readonly ingresosService: IngresosService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createIngresoDto: CreateIngresoDto, @Req() req: any) {
    return this.ingresosService.create(createIngresoDto, req.token);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.ingresosService.findAll(req.token);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.ingresosService.remove(id, req.token);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    return this.ingresosService.update(id, updateData, req.token);
  }
}
