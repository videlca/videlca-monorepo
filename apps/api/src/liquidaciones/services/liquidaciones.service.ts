
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager, } from 'typeorm';
import { Liquidacione } from '../entities/liquidacione.entity';
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

@Injectable()
export class LiquidacionesService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Liquidacione)
    private readonly repo: Repository<Liquidacione>,
    @InjectRepository(OrdenServicio) private readonly ordenRepo: Repository<OrdenServicio>,
    @InjectRepository(GrupoLiquidacion)
    private readonly grupoLiquidacionrepo: Repository<GrupoLiquidacion>
  ) { }

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
  async generarGrupoMensual(dto: { anio: number; mes: number; ordenIds: number[] }) {
    const { anio, mes, ordenIds } = dto;
    if (!anio || !mes || mes < 1 || mes > 12 || !ordenIds?.length) {
      throw new BadRequestException('Parámetros inválidos');
    }

    const today = new Date();
    if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes))
      throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    if (today.getMonth() + 1 === mes && today.getDate() < 20)
      throw new BadRequestException('No se puede liquidar antes del 20 del mes actual')

    return this.withRetry(() =>
      this.ds.transaction('READ COMMITTED', async (tm) => {
        const gRepo = tm.getRepository(GrupoLiquidacion);
        const lRepo = tm.getRepository(Liquidacione);

        // 1) Crear grupo
        const grupo = await gRepo.save(gRepo.create({ estado: false, total: 0 }));

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
        grupo.descripcion = `liquidacion_${mes}_${anio}_${grupo.idGrupoLiquidacion}`
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
    const liqRepo = manager.getRepository(Liquidacione);

    const orden = await ordenRepo
      .createQueryBuilder('os')
      .leftJoinAndSelect('os.idEstadoOrdenServicio', 'estado')
      .where('os.idOrdenServicio = :id', { id: ordenId })
      .andWhere('estado.nombre <> :estado', { estado: 'ANULADA' })
      .getOne();


    if (!orden) throw new BadRequestException('Orden no encontrada');

    const total = Number(orden.precioTotal ?? 0);
    if (!isFinite(total) || total <= 0) throw new BadRequestException('PrecioTotal inválido');

    // 2) calcula monto (usa tus helpers reales)
    const start = toUTCDateOnly(orden.fechaInicio);
    const end = orden.fechaFin ? toUTCDateOnly(orden.fechaFin) : null;

    const mesIni = new Date(Date.UTC(anio, mes1a12 - 1, 1));
    const mesFin = endOfMonth(mesIni);
    const desde = maxDate(start, mesIni);
    const hasta = end ? minDate(end, mesFin) : mesFin;
    if (hasta < desde) throw new BadRequestException('La orden no tiene días en el mes solicitado');

    const totalDiasOrden = end ? diffDaysInclusive(start, end) : diffDaysInclusive(start, hasta);
    const diasEnEsteMes = diffDaysInclusive(desde, hasta);

    const startSameMonth = start.getUTCFullYear() === anio && start.getUTCMonth() === (mes1a12 - 1);
    const endSameMonth = end ? (end.getUTCFullYear() === anio && end.getUTCMonth() === (mes1a12 - 1)) : false;
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
    const finMes = new Date(Date.UTC(anio, mes1a12, 1, 0, 0, 0)); // inicio del mes siguiente

    const qb = this.ordenRepo
      .createQueryBuilder('os')
      .where('os.fechaInicio < :fin AND (os.fechaFin IS NULL OR os.fechaFin >= :ini)', {
        ini: inicioMes,
        fin: finMes,
      })
      .andWhere('eos.nombre <> :estado', { estado: 'ANULADA' })
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

      // ✅ JOIN con liquidaciones en rango de fechas
      .leftJoin('liquidaciones', 'liq', `
    liq.idOrdenServicio = os.idOrdenServicio AND
    liq.fechaCreacion >= :ini AND liq.fechaCreacion < :fin
  `, {
        ini: inicioMes,
        fin: finMes,
      })

      .andWhere('liq.idLiquidacion IS NULL')

      .orderBy('os.idOrdenServicio', 'ASC')
      .addOrderBy('ost.idOrdenServicioTarifa', 'ASC')
      .distinct(true);


    return qb.getMany(); // <- NO usar getOne()
  }


  async findByEstado(estado: boolean) {
    return this.grupoLiquidacionrepo.find({
      where: { estado },
      order: { idGrupoLiquidacion: 'DESC' },
    });
    // Si prefieres QB:
    // return this.repo
    //   .createQueryBuilder('g')
    //   .where('g.estado = :estado', { estado })
    //   .orderBy('g.idGrupoLiquidacion', 'DESC')
    //   .getMany();
  }


  async liquidarGrupo(idGrupoLiquidacion: number) {
    return this.withRetry(() =>
      this.ds.transaction('READ COMMITTED', async (tm) => {
        const grupoRepo = tm.getRepository(GrupoLiquidacion);
        const liqRepo = tm.getRepository(Liquidacione);

        // 1. Verificar que exista el grupo
        const grupo = await grupoRepo.findOne({
          where: { idGrupoLiquidacion },
        });
        if (!grupo) throw new NotFoundException('Grupo de liquidación no encontrado');

        // 2. Confirmar grupo (estado = true)
        grupo.estado = true;
        await grupoRepo.save(grupo);

        // 3. Confirmar TODAS las liquidaciones del grupo
        await liqRepo
          .createQueryBuilder()
          .update()
          .set({ estado: true })
          .where('idGrupoLiquidacion = :id', { id: idGrupoLiquidacion })
          .execute();

        return {
          ok: true,
          grupoId: idGrupoLiquidacion,
          mensaje: 'Grupo y liquidaciones confirmadas exitosamente',
        };
      })
    );
  }

}
