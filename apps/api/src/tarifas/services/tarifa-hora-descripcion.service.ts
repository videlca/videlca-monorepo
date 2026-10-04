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

  // OBTENER LA TARIFA HORA DESCRIPCION POR NOMBRE (los nombres validos estan en TipoHoraDescripcionInterface:
  // "valor hora diurna", "valor hora diurna dominical y festivos", "valor hora nocturna",
  // "valor hora nocturna dominical y festivos", "seguro de vida")
  async findOneByName(nombre: string) {

    const tarifaHoraDescripcion = await this.tarifaHoraDescripcionRepository.findOneBy({ nombre });

    if (!tarifaHoraDescripcion) {
      throw new NotFoundException(`No se ha encontrado la tarifa hora descripcion con nombre "${nombre}"`);
    }

    return tarifaHoraDescripcion;

  }

}
