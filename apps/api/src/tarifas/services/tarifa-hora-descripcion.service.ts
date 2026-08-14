import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TarifaHoraDescripcion } from '../entities';

@Injectable()
export class TarifaHoraDescripcionService {

  constructor(
    @InjectRepository(TarifaHoraDescripcion)
    private readonly tarifaHoraDescripcionRepository: Repository<TarifaHoraDescripcion>,
  ) {}

  // OBTENER TODAS LAS TARIFA HORA DESCRIPCION
  // Esta tabla solo se ajusta desde el backend, por eso unicamente se expone la visualizacion
  async findAll() {

    return await this.tarifaHoraDescripcionRepository.find({
      order: {
        idTarifaHoraDescripcion: 'ASC'
      }
    });

  }

  // OBTENER UNA TARIFA HORA DESCRIPCION
  async findOne(id: number) {

    const tarifaHoraDescripcion = await this.tarifaHoraDescripcionRepository.findOne({
      where: {
        idTarifaHoraDescripcion: id
      }
    });

    if (!tarifaHoraDescripcion) throw new NotFoundException(`Tarifa hora descripcion con id "${id}" no se ha encontrado`);

    return tarifaHoraDescripcion;

  }

  // OBTENER LA TARIFA HORA DESCRIPCION SEGUN SI ES DIURNA/NOCTURNA Y DOMINICAL/NO DOMINICAL
  async findOneByTipo(diurno: boolean, dominical: boolean) {

    const tarifaHoraDescripcion = await this.tarifaHoraDescripcionRepository.findOne({
      where: {
        diurno,
        dominical
      }
    });

    if (!tarifaHoraDescripcion) {
      throw new NotFoundException(`No se ha encontrado la tarifa hora descripcion para diurno="${diurno}" y dominical="${dominical}"`);
    }

    return tarifaHoraDescripcion;

  }

}
