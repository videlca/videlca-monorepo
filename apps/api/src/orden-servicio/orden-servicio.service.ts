import { Injectable } from '@nestjs/common';
import { CreateOrdenServicioDto } from './dto/create-orden-servicio.dto';
import { UpdateOrdenServicioDto } from './dto/update-orden-servicio.dto';

@Injectable()
export class OrdenServicioService {
  create(createOrdenServicioDto: CreateOrdenServicioDto) {
    return 'This action adds a new ordenServicio';
  }

  findAll() {
    return `This action returns all ordenServicio`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ordenServicio`;
  }

  update(id: number, updateOrdenServicioDto: UpdateOrdenServicioDto) {
    return `This action updates a #${id} ordenServicio`;
  }

  remove(id: number) {
    return `This action removes a #${id} ordenServicio`;
  }
}
