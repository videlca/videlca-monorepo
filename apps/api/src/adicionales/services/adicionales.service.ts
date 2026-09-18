import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationOption } from '../../common/interfaces/pagination.interface';
import { ClientesService } from '../../clientes/services';
import { User } from '../../users/entities/user.entity';

import { Adicional } from '../entities';
import { CreateAdicionalDto, UpdateAdicionalDto, FindAdicionalesDto } from '../dto';

@Injectable()
export class AdicionalesService {

  private readonly logger = new Logger('AdicionalesService');

  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta

  constructor(
    @InjectRepository(Adicional)
    private readonly adicionalRepository: Repository<Adicional>,
    private readonly clientesService: ClientesService,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createAdicionalDto: CreateAdicionalDto, user: User) {

    const cliente = await this.clientesService.findOne(createAdicionalDto.idCliente);

    const mesInicio = this.normalizarMes(createAdicionalDto.mesInicio);
    const mesFin = createAdicionalDto.mesFin ? this.normalizarMes(createAdicionalDto.mesFin) : null;

    if (mesFin != null && mesFin < mesInicio) {
      throw new BadRequestException('El mes de fin debe ser posterior o igual al mes de inicio');
    }

    const costosDirectos = createAdicionalDto.costosDirectos ?? 0;
    const seguroVida = createAdicionalDto.seguroVida ?? 0;
    const aui = createAdicionalDto.aui ?? 0;

    const totales = this.calcularTotales(costosDirectos, seguroVida, aui);

    const adicional = this.adicionalRepository.create({
      nombre: createAdicionalDto.nombre,
      idCliente: cliente,
      idUsuarioCreacion: user,
      mesInicio,
      mesFin,
      costosDirectos,
      seguroVida,
      ...totales,
    });

    try {

      await this.adicionalRepository.save(adicional);

      return adicional;

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  async findAll(findAdicionalesDto: FindAdicionalesDto) {

    const { idCliente, pagination, limit = this.defaultLimit, offset = 0 } = findAdicionalesDto;

    const where = idCliente ? { idCliente: { idCliente } } : {};

    if (pagination === PaginationOption.TRUE) {

      const [adicionales, total] = await this.adicionalRepository.findAndCount({
        where,
        take: limit,
        skip: offset,
        order: { fechaCreacion: 'DESC' },
      });

      return {
        data: adicionales,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        }
      };

    }

    const adicionales = await this.adicionalRepository.find({
      where,
      order: { fechaCreacion: 'DESC' },
    });

    return {
      data: adicionales,
      pagination: {
        total: adicionales.length,
        limit: adicionales.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  async findOne(id: number) {

    const adicional = await this.adicionalRepository.findOneBy({ idAdicional: id });

    if (!adicional) throw new NotFoundException(`Adicional con id "${id}" no se ha encontrado`);

    return adicional;

  }

  async update(id: number, updateAdicionalDto: UpdateAdicionalDto) {

    const adicional = await this.findOne(id);

    const mesInicio = updateAdicionalDto.mesInicio ? this.normalizarMes(updateAdicionalDto.mesInicio) : adicional.mesInicio;

    const mesFin = updateAdicionalDto.mesFin !== undefined
      ? (updateAdicionalDto.mesFin ? this.normalizarMes(updateAdicionalDto.mesFin) : null)
      : adicional.mesFin;

    if (mesFin != null && mesFin < mesInicio) {
      throw new BadRequestException('El mes de fin debe ser posterior o igual al mes de inicio');
    }

    const costosDirectos = updateAdicionalDto.costosDirectos ?? adicional.costosDirectos;
    const seguroVida = updateAdicionalDto.seguroVida ?? adicional.seguroVida;
    const aui = updateAdicionalDto.aui ?? adicional.aui;

    const totales = this.calcularTotales(costosDirectos, seguroVida, aui);

    Object.assign(adicional, {
      nombre: updateAdicionalDto.nombre ?? adicional.nombre,
      mesInicio,
      mesFin,
      costosDirectos,
      seguroVida,
      estado: updateAdicionalDto.estado ?? adicional.estado,
      ...totales,
    });

    try {

      await this.adicionalRepository.save(adicional);

      return adicional;

    } catch (error) {

      this.handleDbExceptions(error);

    }

  }

  // CANCELAR UN ADICIONAL: deja de cobrarse desde este momento, sin importar el mesFin que tuviera configurado.
  // No se elimina, para conservar el historial de lo ya liquidado
  async cancelar(id: number) {

    const adicional = await this.findOne(id);

    adicional.estado = false;

    await this.adicionalRepository.save(adicional);

    return adicional;

  }

  async remove(id: number) {

    const adicional = await this.findOne(id);

    try {

      await this.adicionalRepository.remove(adicional);

    } catch (error) {

      this.logger.error(error);

      if (error.errno == 1451) {
        throw new BadRequestException(`El adicional "${adicional.nombre}" no se puede eliminar debido a que se esta usando en el sistema`);
      }

      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  // NORMALIZA UNA FECHA AL DIA 1 DE SU MES (los adicionales se cobran por mes completo, no por dia)
  private normalizarMes(fecha: Date): Date {

    const f = new Date(fecha);

    return new Date(f.getFullYear(), f.getMonth(), 1);

  }

  // A PARTIR DE COSTOS DIRECTOS, SEGURO VIDA Y AUI (los 3 valores fijos que coloca el usuario, no un porcentaje) CALCULA
  // EL RESTO DE CAMPOS. EL IVA ES DEL 1.9% (0.019), MISMO CRITERIO QUE EL RESTO DE TARIFAS DEL SISTEMA.
  // TODOS LOS VALORES SE REDONDEAN HACIA ARRIBA AL SIGUIENTE NUMERO ENTERO
  private calcularTotales(costosDirectos: number, seguroVida: number, aui: number) {

    const costosDirectosSeguroVida = Math.ceil(costosDirectos + seguroVida);
    const auiRedondeado = Math.ceil(aui);
    const precioAntesIva = costosDirectosSeguroVida + auiRedondeado;
    const iva = Math.ceil(precioAntesIva * 0.019);
    const precioTotal = Math.ceil(precioAntesIva + iva);

    return {
      costosDirectosSeguroVida,
      aui: auiRedondeado,
      precioAntesIva,
      iva,
      precioTotal,
    };

  }

  private handleDbExceptions(error: any) {

    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

}
