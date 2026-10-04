import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrigenServicio } from '../entities';

@Injectable()
export class OrigenServicioService {

  constructor(
    @InjectRepository(OrigenServicio)
    private readonly origenServicioRepository: Repository<OrigenServicio>,
  ) {}

  // OBTENER TODOS LOS ORIGEN SERVICIO
  // Esta tabla solo se ajusta desde el backend, por eso unicamente se expone la visualizacion
  async findAll() {

    return await this.origenServicioRepository.find({
      order: {
        idOrigenServicio: 'ASC'
      }
    });

  }

}
