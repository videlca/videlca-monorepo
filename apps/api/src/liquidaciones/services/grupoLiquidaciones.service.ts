// src/grupo-liquidaciones/grupo-liquidaciones.service.ts
/*
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GrupoLiquidacion } from '../entities/grupo_liquidaciones.entity';
import { CreateGrupoLiquidacionDto } from '../dto/create-grupoLiquidaciones.dto';
import { UpdateGrupoLiquidacionDto } from '../dto//update-grupoLiquidacion.dto';
import { Liquidacione } from 'src/liquidaciones/entities/liquidacione.entity';
import { OrdenServicio } from 'src/orden-servicio/entities';
import { LiquidacionesService } from './liquidaciones.service';
import { CrearGrupoMensualDto } from '../dto/crearGrupoMensual.dto';


@Injectable()
export class GrupoLiquidacionesService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(GrupoLiquidacion) private readonly repo: Repository<GrupoLiquidacion>,
    @InjectRepository(Liquidacione) private readonly liqRepo: Repository<Liquidacione>,
    @InjectRepository(OrdenServicio) private readonly ordenRepo: Repository<OrdenServicio>,
    private readonly liquidacionesService: LiquidacionesService
  ) { }

  async create(dto: CreateGrupoLiquidacionDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  // GET /grupo-liquidaciones (paginado opcional)
  async findAll() {
    const estados = ['ANULADO', 'PROGRAMADO', 'LIQUIDADA']; // o dinámico

    const qb = this.repo.createQueryBuilder('g');

    if (estados.length) {
      qb.leftJoinAndSelect(
        'g.liquidaciones',
        'l',
        `NOT EXISTS (
        SELECT 1
        FROM orden_servicio os2
        JOIN estado_orden_servicio eos2
          ON eos2.idEstadoOrdenServicio = os2.idEstadoOrdenServicio
       WHERE os2.idOrdenServicio = l.idOrdenServicio
         AND eos2.nombre IN (:...estados)
      )`,
        { estados }
      );
    } else {
      qb.leftJoinAndSelect('g.liquidaciones', 'l');
    }

    qb.leftJoinAndSelect('l.ordenServicio', 'os')
      .leftJoinAndSelect('os.idEstadoOrdenServicio', 'eos')
      .orderBy('g.idGrupoLiquidacion', 'DESC');

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: number) {
    const found = await this.repo.findOne({
      where: { idGrupoLiquidacion: id },
      relations: { liquidaciones: true },
      order: { idGrupoLiquidacion: 'DESC' },
    });
    if (!found) throw new NotFoundException('Grupo no encontrado');
    return found;
  }

  async update(id: number, dto: UpdateGrupoLiquidacionDto) {
    const found = await this.repo.findOneBy({ idGrupoLiquidacion: id });
    if (!found) throw new NotFoundException('Grupo no encontrado');
    Object.assign(found, dto);
    return this.repo.save(found);
  }

  async remove(id: number) {
    const found = await this.repo.findOneBy({ idGrupoLiquidacion: id });
    if (!found) throw new NotFoundException('Grupo no encontrado');
    await this.repo.remove(found);
    return { ok: true };
  }


  async recalcTotal(id: number) {
    const grupo = await this.repo.findOneBy({ idGrupoLiquidacion: id });
    if (!grupo) throw new NotFoundException('Grupo no encontrado');

    const { sum } = await this.liqRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.valor_liquidacion), 0)', 'sum')
      .where('l.idGrupoLiquidacion = :id', { id })
      .getRawOne<{ sum: string }>();

    grupo.total = Number(sum ?? 0);
    await this.repo.save(grupo);
    return { idGrupoLiquidacion: id, total: grupo.total };
  }


  async findByCreacionMes(anio: number, mes1a12: number) {
  if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
    throw new BadRequestException('Parámetros inválidos (anio, mes)');
  }

  // Rango del mes objetivo: [inicioMes, finMes)
  const inicioMes = new Date(Date.UTC(anio, mes1a12 - 1, 1, 0, 0, 0));
  const finMes    = new Date(Date.UTC(anio, mes1a12,     1, 0, 0, 0)); // inicio del mes siguiente

  const qb = this.ordenRepo
    .createQueryBuilder('os')
    // 👇 Solape con el mes objetivo (maneja fechaFin NULL)
    .where('os.fechaInicio < :fin AND (os.fechaFin IS NULL OR os.fechaFin >= :ini)', {
      ini: inicioMes,
      fin: finMes,
    })

    // Joins (filtros en JOIN para preservar LEFT)
    .leftJoinAndSelect('os.tarifas', 'ost')
    .leftJoinAndSelect('ost.idTarifa', 't', 't.estado = 1')
    .leftJoinAndSelect(
      't.idPeriodo',
      'p',
      'p.periodoActivoFacturacion = 1 OR (CURRENT_DATE BETWEEN p.fechaInicio AND p.fechaFin)',
    )
    .leftJoinAndSelect('t.idTipoTarifa', 'tt')
    .leftJoinAndSelect('t.idServicio', 's')
    .leftJoinAndSelect('os.idEstadoOrdenServicio', 'eos')

    .orderBy('os.idOrdenServicio', 'ASC')
    .addOrderBy('ost.idOrdenServicioTarifa', 'ASC')
    .distinct(true);

  return qb.getMany(); // <- NO usar getOne()
  }



  async generarGrupoMensual(dto: CrearGrupoMensualDto) {
    const { anio, mes, descripcion, ordenIds } = dto;
    if (!ordenIds?.length) throw new BadRequestException('ordenIds no puede estar vacío');

    return this.ds.transaction(async (tm) => {
      const gRepo = tm.getRepository(GrupoLiquidacion);
      const lRepo = tm.getRepository(Liquidacione);

      // 1) Crear grupo
      const grupo = gRepo.create({ descripcion, estado: true, total: 0 });
      const grupoSaved = await gRepo.save(grupo);
      

      const resultados: Array<{
        ordenId: number;
        ok: boolean;
        error?: string;
        liquidacionId?: number;
        monto?: number;
      }> = [];

      let total = 0;

      // 2) Procesar cada orden (secuencial para simplificar errores)
      for (const ordenId of ordenIds) {
        try {
          const res = await this.liquidacionesService.crearLiquidacionParaMes(ordenId, anio, mes, grupoSaved.idGrupoLiquidacion);
          // res.item debe ser la Liquidacione creada por tu función
          const liqId = res.item?.idLiquidacion;

          if (!liqId) throw new Error('No se obtuvo idLiquidacion del creador');

          // 3) Asignar el grupo a la liquidación creada
          await lRepo.update(liqId, { idGrupoLiquidacion: grupoSaved.idGrupoLiquidacion });

          total += Number(res.montoLiquidacion ?? res.item?.valor_liquidacion ?? 0);

          resultados.push({ ordenId, ok: true, liquidacionId: liqId, monto: Number(res.montoLiquidacion ?? res.item?.valor_liquidacion ?? 0) });
        } catch (e: any) {
          resultados.push({ ordenId, ok: false, error: e?.message ?? 'Error al crear liquidación' });
        }
      }

      // 4) Actualizar total del grupo
      grupoSaved.total = total;
      await gRepo.save(grupoSaved);

      return {
        grupo: grupoSaved,
        resultados,                 // una entrada por orden solicitada
        totalGenerado: total,
        procesadas: resultados.filter(r => r.ok).length,
        fallidas: resultados.filter(r => !r.ok).length,
      };
    });
  }
}
*/
