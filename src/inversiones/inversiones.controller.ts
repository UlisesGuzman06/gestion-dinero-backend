import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { InversionesService } from './inversiones.service';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('inversiones')
export class InversionesController {
  constructor(private readonly inversionesService: InversionesService) {}

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.inversionesService.findAll(req.token);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() data: { monto: number; descripcion: string; fecha?: Date }, @Req() req: any) {
    return this.inversionesService.create(data, req.token);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.inversionesService.remove(id, req.token);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    return this.inversionesService.update(id, updateData, req.token);
  }
}
