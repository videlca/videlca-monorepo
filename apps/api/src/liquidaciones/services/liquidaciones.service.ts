
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager, } from 'typeorm';
import { Liquidacione } from '../entities/liquidacione.entity';
import { UpdateLiquidacioneDto } from '../dto/update-liquidacione.dto';
import { OrdenServicio } from '../../orden-servicio/entities';
import {
  toUTCDateOnly,
  endOfMonth,
  minDate,
  maxDate,
  diffDaysInclusive,
  round2,
} from '../../common/utils/date-helpers';
import { GrupoLiquidacion } from '../entities/grupo_liquidaciones.entity';



/*
@Injectable()
export class LiquidacionesService {
  constructor(
    @InjectRepository(Liquidacione)
    private readonly repo: Repository<Liquidacione>,
    @InjectRepository(OrdenServicio) private readonly ordenRepo: Repository<OrdenServicio>,
    private readonly ds: DataSource,
    private ordenServicioService: OrdenServicioService
  ) { }

  async create(dto: CreateLiquidacioneDto) {
    const entity = this.repo.create({
      valor_liquidacion: dto.valor_liquidacion,
      ordenServicio: { idOrdenServicio: dto.idOrdenServicio } as any,
    });
    return this.repo.save(entity);
  }

  async findAll(params?: { page?: number; limit?: number; ordenId?: number }) {
    const page = Math.max(1, Number(params?.page ?? 1));
    const take = Math.min(100, Math.max(1, Number(params?.limit ?? 20)));
    const skip = (page - 1) * take;

    const qb = this.repo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.ordenServicio', 'os')
      .select([
        'l.idLiquidacion',
        'l.valor_liquidacion',
        'l.fechaCreacion',
        'l.idOrdenServicio',
        'os.idOrdenServicio',
        'os.fechaInicio',
        'os.fechaFin',
        'os.precioTotal',

      ])
      .orderBy('l.idLiquidacion', 'DESC')
      .skip(skip)
      .take(take)
      .distinct(true);

    if (params?.ordenId != null) {
      qb.andWhere('l.idOrdenServicio = :oid', { oid: Number(params.ordenId) });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit: take };
  }


  async findOne(id: number) {
    const liq = await this.repo.findOne({
      where: { idLiquidacion: id },
      relations: { ordenServicio: true },
    });
    if (!liq) throw new NotFoundException('Liquidación no encontrada');
    return liq;
  }

  async update(id: number, dto: UpdateLiquidacioneDto) {
    const liq = await this.repo.findOne({ where: { idLiquidacion: id } });
    if (!liq) throw new NotFoundException('Liquidación no encontrada');

    if (dto.valor_liquidacion !== undefined) liq.valor_liquidacion = dto.valor_liquidacion;
    if (dto.idOrdenServicio !== undefined) {
      liq.ordenServicio = { idOrdenServicio: dto.idOrdenServicio } as any;
    }
    return this.repo.save(liq);
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Liquidación no encontrada');
    return { ok: true };
  }


  //Logica liquidaciones ------------------------------------------------------------------------------

  async crearLiquidacionParaMes(ordenId: number, anio: number, mes1a12: number, idGrupoLiquidacion: number) {
    if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
      throw new BadRequestException('Parámetros de fecha inválidos (anio, mes)');
    }

    const today = new Date();
    if(today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth()+1 < mes1a12)) 
      throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    if(today.getMonth()+1 === mes1a12 && today.getDate() < 20)
      throw new BadRequestException('No se puede liquidar antes del 20 del mes actual')
      


    const orden = await this.ordenRepo
    .createQueryBuilder('os')
    .where('os.idOrdenServicio = :id', { id: ordenId })
    .leftJoinAndSelect('os.tarifas', 'ost')
    .leftJoinAndSelect('ost.idTarifa', 't') 
    .leftJoinAndSelect('t.idTipoTarifa', 'tt')
    .leftJoinAndSelect('t.idServicio', 's')
    .leftJoinAndSelect('t.idPeriodo', 'p')
    .leftJoinAndSelect('os.idEstadoOrdenServicio', 'eos')
    .andWhere('t.estado = 1')
    .andWhere('(p.periodoActivoFacturacion = 1 OR (CURRENT_DATE BETWEEN p.fechaInicio AND p.fechaFin))')
    .orderBy('ost.idOrdenServicioTarifa', 'ASC')
    .distinct(true)
    .getOne()


    if (!orden) throw new NotFoundException('Orden de servicio no encontrada');

    if (
      orden.idEstadoOrdenServicio.nombre === EstadoOrdenServicio.ANULADA ||
      orden.idEstadoOrdenServicio.nombre === EstadoOrdenServicio.PROGRAMADO
    ){
      throw new BadRequestException(`La orden se encuentra en estado: ${orden.idEstadoOrdenServicio.nombre}`);
    }

    if (orden.fechaFin !== null) {
      const total = orden.precioTotal
      if (!isFinite(total) || total <= 0) {

        throw new BadRequestException('La orden no tiene un valor total válido');
      }

      const start = toUTCDateOnly(orden.fechaInicio);
      const end = toUTCDateOnly(orden.fechaFin);
      if (end < start) throw new BadRequestException('Fecha fin no puede ser anterior a fecha inicio');

      // Rango del mes objetivo [mesIni, mesFin]
      const mesIni = new Date(Date.UTC(anio, mes1a12 - 1, 1));
      const mesFin = endOfMonth(mesIni);

      // Intersección [desde, hasta] entre [start,end] y [mesIni,mesFin]
      const desde = maxDate(start, mesIni);
      const hasta = minDate(end, mesFin);

      // Si no hay solapamiento, no corresponde liquidación para ese mes
      if (hasta < desde) {
        throw new BadRequestException('La orden no tiene días en el mes solicitado');
      }

      const totalDiasOrden = diffDaysInclusive(start, end);
      const diasEnEsteMes = diffDaysInclusive(desde, hasta);

      // Si el rango de la orden cae ENTERO dentro del mes objetivo y además start y end están en ese mismo mes:
      const startSameMonth = start.getUTCFullYear() === anio && start.getUTCMonth() === (mes1a12 - 1);
      const endSameMonth = end.getUTCFullYear() === anio && end.getUTCMonth() === (mes1a12 - 1);
      const ordenCompletaDentroDelMes = startSameMonth && endSameMonth;

      const monto = ordenCompletaDentroDelMes
        ? round2(total)
        : round2((total * diasEnEsteMes) / totalDiasOrden);

      // Guardar liquidación
      const entity = this.repo.create({
        valor_liquidacion: monto,
        ordenServicio: { idOrdenServicio: orden.idOrdenServicio } as any,
        idGrupoLiquidacion: idGrupoLiquidacion

      });

      const saved = await this.ds.transaction(async (tm) => tm.getRepository(Liquidacione).save(entity));

      return {
        ordenId,
        anio,
        mes: mes1a12,
        periodoMes: { desde: fmtYMD(mesIni), hasta: fmtYMD(mesFin) },
        rangoOrden: { desde: fmtYMD(start), hasta: fmtYMD(end), dias: totalDiasOrden },
        rangoMesEnOrden: { desde: fmtYMD(desde), hasta: fmtYMD(hasta), dias: diasEnEsteMes },
        montoLiquidacion: saved.valor_liquidacion,
        item: saved,
      };
    } else if (orden.fechaFin === null) {
      //lógica de orden indefinida.

      let totalTarifas = 0;
      for (let tarifa of orden.tarifas) {
        const precioOrden: PrecioOrdenDto = {
          idTarifa: tarifa.idTarifa.idTarifa,
          horaInicio: tarifa.horaInicio,
          horaFin: tarifa.horaFin,
          fechaInicio: orden.fechaInicio,
          fechaFin: null
        }

        const precioTarifa = (await this.ordenServicioService.obtenerPrecio(precioOrden)).precio;
        totalTarifas += +precioTarifa;

      }

      if (!totalTarifas || totalTarifas <= 0) throw new Error('Precio de tarifas inválido');

      const start = toUTCDateOnly(orden.fechaInicio);
      const end = orden.fechaFin ? toUTCDateOnly(orden.fechaFin) : null;

      const mesIni = new Date(Date.UTC(anio, mes1a12 - 1, 1));
      const mesFin = endOfMonth(mesIni);

      // Sin solapamiento con la orden
      if ((end && mesIni > end) || mesFin < start) throw new BadRequestException('La orden no tiene días en el mes solicitado');

      const esMesInicio = start.getUTCFullYear() === anio && (start.getUTCMonth() + 1) === mes1a12;
      const esMesFin = !!end && end.getUTCFullYear() === anio && (end.getUTCMonth() + 1) === mes1a12;
      const totalDiasOrden = diffDaysInclusive(start, end);
      // Prorrateo (primer mes o mes final)
      const desde = esMesInicio ? start : mesIni;
      const hasta = esMesFin ? end! : mesFin;
      const diasEnEsteMes = diffDaysInclusive(desde, hasta);
      let valor_liquidacion

      if (!esMesInicio && !esMesFin && (!end || mesFin <= end) && mesIni >= start) {
        // Mes completo dentro de la orden indefinida
        // Guardar liquidación
        const entity = this.repo.create({
          valor_liquidacion: round2(totalTarifas),
          ordenServicio: { idOrdenServicio: orden.idOrdenServicio } as any,
        });

        const saved = await this.ds.transaction(async (tm) => tm.getRepository(Liquidacione).save(entity));

        return {
          ordenId,
          anio,
          mes: mes1a12,
          periodoMes: { desde: fmtYMD(mesIni), hasta: fmtYMD(mesFin) },
          rangoOrden: { desde: fmtYMD(start), hasta: 'Orden indefinida', dias: totalDiasOrden },
          rangoMesEnOrden: { desde: fmtYMD(desde), hasta: fmtYMD(hasta), dias: diasEnEsteMes },
          montoLiquidacion: saved.valor_liquidacion,
          item: saved,
        };
      }



      const diasMes = diffDaysInclusive(mesIni, mesFin);
      const diasCubiertos = diffDaysInclusive(desde, hasta);


      // Guardar liquidación
      valor_liquidacion = round2((totalTarifas * diasCubiertos) / diasMes)
      const entity = this.repo.create({
        valor_liquidacion: valor_liquidacion,
        ordenServicio: { idOrdenServicio: orden.idOrdenServicio } as any,
        idGrupoLiquidacion: idGrupoLiquidacion
      });

      const saved = await this.ds.transaction(async (tm) => tm.getRepository(Liquidacione).save(entity));

      return {
        ordenId,
        anio,
        mes: mes1a12,
        periodoMes: { desde: fmtYMD(mesIni), hasta: fmtYMD(mesFin) },
        rangoOrden: { desde: fmtYMD(start), hasta: 'Orden indefinida', dias: 'Orden indefinida' },
        rangoMesEnOrden: { desde: fmtYMD(desde), hasta: fmtYMD(hasta), dias: diasEnEsteMes },
        montoLiquidacion: saved.valor_liquidacion,
        item: saved,
      };


    }
  }


}

*/



// importa helpers (toUTCDateOnly, etc.) y OrdenServicio según tengas

@Injectable()
export class LiquidacionesService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Liquidacione)
    private readonly repo: Repository<Liquidacione>,
    @InjectRepository(OrdenServicio) private readonly ordenRepo: Repository<OrdenServicio>,
  ) {}

  async findAll(params?: { page?: number; limit?: number; ordenId?: number }) {
    const page = Math.max(1, Number(params?.page ?? 1));
    const take = Math.min(100, Math.max(1, Number(params?.limit ?? 20)));
    const skip = (page - 1) * take;

    const qb = this.repo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.ordenServicio', 'os')
      .select([
        'l.idLiquidacion',
        'l.valor_liquidacion',
        'l.fechaCreacion',
        'l.idOrdenServicio',
        'os.idOrdenServicio',
        'os.fechaInicio',
        'os.fechaFin',
        'os.precioTotal',

      ])
      .orderBy('l.idLiquidacion', 'DESC')
      .skip(skip)
      .take(take)
      .distinct(true);

    if (params?.ordenId != null) {
      qb.andWhere('l.idOrdenServicio = :oid', { oid: Number(params.ordenId) });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit: take };
  }


  async findOne(id: number) {
    const liq = await this.repo.findOne({
      where: { idLiquidacion: id },
      relations: { ordenServicio: true },
    });
    if (!liq) throw new NotFoundException('Liquidación no encontrada');
    return liq;
  }

  async update(id: number, dto: UpdateLiquidacioneDto) {
    const liq = await this.repo.findOne({ where: { idLiquidacion: id } });
    if (!liq) throw new NotFoundException('Liquidación no encontrada');

    if (dto.valor_liquidacion !== undefined) liq.valor_liquidacion = dto.valor_liquidacion;
    if (dto.idOrdenServicio !== undefined) {
      liq.ordenServicio = { idOrdenServicio: dto.idOrdenServicio } as any;
    }
    return this.repo.save(liq);
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Liquidación no encontrada');
    return { ok: true };
  }


  // --- RETRY helper para 1205/1213 ---
  private async withRetry<T>(fn: () => Promise<T>, max = 2): Promise<T> {
    let last: any;
    for (let i = 0; i <= max; i++) {
      try { return await fn(); }
      catch (e: any) {
        const msg = String(e?.message ?? e);
        const code = e?.code || e?.errno;
        const lockErr =
          msg.includes('Lock wait timeout') ||
          msg.includes('Deadlock') ||
          code === 1205 || code === 1213;
        if (!lockErr || i === max) throw e;
        await new Promise(r => setTimeout(r, 150 + i * 150)); // backoff corto
        last = e;
      }
    }
    throw last;
  }

  // === pública: genera grupo y liquidaciones ===
  async generarGrupoMensual(dto: { anio: number; mes: number; descripcion: string; ordenIds: number[] }) {
    const { anio, mes, descripcion, ordenIds } = dto;
    if (!anio || !mes || mes < 1 || mes > 12 || !ordenIds?.length) {
      throw new BadRequestException('Parámetros inválidos');
    }

     const today = new Date();
    if(today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth()+1 < mes)) 
      throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    if(today.getMonth()+1 === mes && today.getDate() < 20)
      throw new BadRequestException('No se puede liquidar antes del 20 del mes actual')

    return this.withRetry(() =>
      this.ds.transaction('READ COMMITTED', async (tm) => {
        const gRepo = tm.getRepository(GrupoLiquidacion);
        const lRepo = tm.getRepository(Liquidacione);

        // 1) Crear grupo
        const grupo = await gRepo.save(gRepo.create({ descripcion, estado: true, total: 0 }));

        // 2) Bloquear el grupo para este batch (evita que otro hilo lo toque)
        await tm
          .createQueryBuilder(GrupoLiquidacion, 'g')
          .where('g.idGrupoLiquidacion = :id', { id: grupo.idGrupoLiquidacion })
          .setLock('pessimistic_write')  // SELECT ... FOR UPDATE
          .getOne();

        const resultados: any[] = [];
        const nuevas: Liquidacione[] = [];

        // 3) Procesar órdenes secuencialmente en la MISMA transacción/manager
        for (const ordenId of ordenIds) {
          try {
            const liq = await this.crearLiquidacionParaMesTx(
              tm, ordenId, anio, mes, grupo.idGrupoLiquidacion
            );
            nuevas.push(liq);
            resultados.push({ ordenId, ok: true, liquidacionId: liq.idLiquidacion, monto: Number(liq.valor_liquidacion) });
          } catch (e: any) {
            resultados.push({ ordenId, ok: false, error: e?.message ?? 'Error' });
          }
        }

        // 4) Recalcular total UNA sola vez
        const { sum } = await lRepo
          .createQueryBuilder('l')
          .select('COALESCE(SUM(l.valor_liquidacion),0)', 'sum')
          .where('l.idGrupoLiquidacion = :id', { id: grupo.idGrupoLiquidacion })
          .getRawOne<{ sum: string }>();

        grupo.total = Number(sum ?? 0);
        await gRepo.save(grupo);

        return {
          grupo,
          resultados,
          totalGenerado: grupo.total,
          procesadas: resultados.filter(r => r.ok).length,
          fallidas: resultados.filter(r => !r.ok).length,
        };
      })
    );
  }

  // === hija: CREA la liquidación usando el manager existente (SIN abrir transacción nueva) ===
  private async crearLiquidacionParaMesTx(
    manager: EntityManager,
    ordenId: number,
    anio: number,
    mes1a12: number,
    idGrupoLiquidacion: number,
  ): Promise<Liquidacione> {
    // 1) trae orden con manager
    const ordenRepo = manager.getRepository(OrdenServicio);
    const liqRepo   = manager.getRepository(Liquidacione);

    const orden = await ordenRepo.findOne({ where: { idOrdenServicio: ordenId } });
    if (!orden) throw new BadRequestException('Orden no encontrada');

    const total = Number(orden.precioTotal ?? 0);
    if (!isFinite(total) || total <= 0) throw new BadRequestException('PrecioTotal inválido');

    // 2) calcula monto (usa tus helpers reales)
    const start = toUTCDateOnly(orden.fechaInicio);
    const end   = orden.fechaFin ? toUTCDateOnly(orden.fechaFin) : null;

    const mesIni = new Date(Date.UTC(anio, mes1a12 - 1, 1));
    const mesFin = endOfMonth(mesIni);
    const desde  = maxDate(start, mesIni);
    const hasta  = end ? minDate(end, mesFin) : mesFin;
    if (hasta < desde) throw new BadRequestException('La orden no tiene días en el mes solicitado');

    const totalDiasOrden = end ? diffDaysInclusive(start, end) : diffDaysInclusive(start, hasta);
    const diasEnEsteMes  = diffDaysInclusive(desde, hasta);

    const startSameMonth = start.getUTCFullYear() === anio && start.getUTCMonth() === (mes1a12 - 1);
    const endSameMonth   = end ? (end.getUTCFullYear() === anio && end.getUTCMonth() === (mes1a12 - 1)) : false;
    const ordenCompletaDentroDelMes = startSameMonth && endSameMonth;

    const monto = ordenCompletaDentroDelMes
      ? round2(total)
      : round2((total * diasEnEsteMes) / totalDiasOrden);

    // 3) inserta liquidación con FK del grupo
    const entity = liqRepo.create({
      idOrdenServicio: orden.idOrdenServicio,
      idGrupoLiquidacion,
      valor_liquidacion: monto,
    });
    return liqRepo.save(entity);
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
    .leftJoinAndSelect('os.ordenServicioId', 'osid')
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

}
