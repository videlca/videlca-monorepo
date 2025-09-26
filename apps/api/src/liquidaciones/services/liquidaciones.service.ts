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
  fmtYMD,
} from '../../common/utils/date-helpers';
import { GrupoLiquidacion } from '../entities/grupo_liquidaciones.entity';
import { UpdateGrupoLiquidacionEstadoDto } from '../dto/updateGrupoLiquidacionEstado.dto';
import { PrecioOrdenDto } from 'src/orden-servicio/dto';
import { OrdenServicioService } from 'src/orden-servicio/services';
import { Cliente } from 'src/clientes/entities';
import { Tarifa } from 'src/tarifas/entities';

type ClienteGrupoResumen = {
  cliente: Cliente;
  totalLiquidaciones: number;
  totalOrdenes: number;
  ordenes: Array<{
    liquidacionId: number;
    valorLiquidacion: number;
    fechaCreacion: Date;
    totalOrdenServicio: number;
    ordenServicio: OrdenServicio;
    servicios: Tarifa[];
  }>;
};

@Injectable()
export class LiquidacionesService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Liquidacione)
    private readonly repo: Repository<Liquidacione>,
    @InjectRepository(OrdenServicio) private readonly ordenRepo: Repository<OrdenServicio>,
    @InjectRepository(GrupoLiquidacion)
    private readonly grupoLiquidacionrepo: Repository<GrupoLiquidacion>,

    private ordenServicioService: OrdenServicioService,
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
//    if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes))
//      throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

//    if (today.getMonth() + 1 === mes && today.getDate() < 20)
//      throw new BadRequestException('No se puede liquidar antes del 20 del mes actual')

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
  ) {
    // 1) trae orden con manager
    const ordenRepo = manager.getRepository(OrdenServicio);
    const liqRepo = manager.getRepository(Liquidacione);

    const orden = await this.ordenRepo
      .createQueryBuilder('os')
      .leftJoinAndSelect('os.idEstadoOrdenServicio', 'estado')
      .where('os.idOrdenServicio = :id', { id: ordenId })
      .andWhere('estado.nombre <> :estado', { estado: 'ANULADA' })
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



    if (!orden) throw new BadRequestException('Orden no encontrada');


    if (orden.fechaFin !== null) {
      const total = Number(orden.precioTotal ?? 0);
      const mesIni = new Date(Date.UTC(anio, mes1a12 - 1, 1));
      const start = toUTCDateOnly(orden.fechaInicio);
      const end = orden.fechaFin ? toUTCDateOnly(orden.fechaFin) : null;
      const mesFin = endOfMonth(mesIni);
      const desde = maxDate(start, mesIni);
      const hasta = end ? minDate(end, mesFin) : mesFin;
      if (!isFinite(total) || total <= 0) throw new BadRequestException('PrecioTotal inválido');

      // 2) calcula monto (usa tus helpers reales)

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
        aniomes_liquidacion: `${anio}${mes1a12}`,
      });
      return this.withRetry(() => liqRepo.save(entity));
    } else if (!orden.fechaFin) {
      const start = toUTCDateOnly(orden.fechaInicio);
      const end = null; // indefinida

      const mesIni = new Date(Date.UTC(anio, mes1a12 - 1, 1));
      const mesFin = endOfMonth(mesIni);

      // Validación de solapamiento con el mes
      if (mesFin < start) throw new BadRequestException('La orden no tiene días en el mes solicitado');

      const desde = maxDate(start, mesIni);
      const hasta = mesFin;

      const totalDiasOrden = diffDaysInclusive(start, hasta);
      const diasEnEsteMes = diffDaysInclusive(desde, hasta);

      const startSameMonth = start.getUTCFullYear() === anio && start.getUTCMonth() === (mes1a12 - 1);
      const ordenCompletaDentroDelMes = startSameMonth;
      //lógica de orden indefinida.
      let totalTarifas = 0;
      for (const tarifa of orden.tarifas ?? []) {
        const precioOrden: PrecioOrdenDto = {
          idTarifa: tarifa.idTarifa.idTarifa,
          horaInicio: tarifa.horaInicio,
          horaFin: tarifa.horaFin,
          fechaInicio: desde,
          fechaFin: hasta,
        };

        const precioTarifa = (await this.ordenServicioService.obtenerPrecio(precioOrden)).precio;
        totalTarifas += +precioTarifa;
      }

      // if (!totalTarifas || totalTarifas <= 0) throw new Error('Precio de tarifas inválido');


      const monto = ordenCompletaDentroDelMes
        ? round2(totalTarifas)
        : round2((totalTarifas * diasEnEsteMes) / totalDiasOrden);

      const entity = this.repo.create({
        valor_liquidacion: monto,
        ordenServicio: { idOrdenServicio: orden.idOrdenServicio } as any,
        idGrupoLiquidacion,
        aniomes_liquidacion: `${anio}${mes1a12}`,
      });
      return this.withRetry(() => liqRepo.save(entity));

    }

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
      .leftJoinAndSelect('os.idLocacion', 'l')
      .leftJoinAndSelect('l.idCliente', 'c')
      .leftJoinAndSelect('t.idTipoTarifa', 'tt')
      .leftJoinAndSelect('t.idServicio', 's')
      .leftJoinAndSelect('os.idEstadoOrdenServicio', 'eos')

      .leftJoin('liquidaciones', 'liq', `
      liq.idOrdenServicio = os.idOrdenServicio AND
      liq.aniomes_liquidacion = :aniomes
    `, {
        aniomes: `${anio}${mes1a12}`,
      })
      .andWhere('liq.idLiquidacion IS NULL')
      .orderBy('os.idOrdenServicio', 'ASC')
      .addOrderBy('ost.idOrdenServicioTarifa', 'ASC')
      .distinct(true);

    return qb.getMany();
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

  async desintegrarGrupo(idGrupoLiquidacion: number) {
    return this.withRetry(() =>
      this.ds.transaction('READ COMMITTED', async (tm) => {
        const grupoRepo = tm.getRepository(GrupoLiquidacion);
        const liqRepo = tm.getRepository(Liquidacione);

        const grupo = await grupoRepo.findOne({ where: { idGrupoLiquidacion } });
        if (!grupo) throw new NotFoundException('Grupo de liquidación no encontrado');

        await liqRepo
          .createQueryBuilder()
          .delete()
          .where('idGrupoLiquidacion = :id', { id: idGrupoLiquidacion })
          .execute();

        await grupoRepo
          .createQueryBuilder()
          .delete()
          .where('idGrupoLiquidacion = :id', { id: idGrupoLiquidacion })
          .execute();

        return {
          ok: true,
          grupoId: idGrupoLiquidacion,
          mensaje: 'Grupo de liquidación y sus liquidaciones eliminadas correctamente',
        };
      })
    );
  }

  async actualizarCampoGrupoEstado(id: number, dto: UpdateGrupoLiquidacionEstadoDto) {
    const grupo = await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: id },
    });

    if (!grupo) throw new NotFoundException('Grupo de liquidación no encontrado');

    grupo[dto.campo] = dto.valor;
    await this.grupoLiquidacionrepo.save(grupo);

    return {
      ok: true,
      grupoId: id,
      campoActualizado: dto.campo,
      nuevoValor: dto.valor,
    };
  }

  async findGruposPorCampoEstado(campo: 'consolidacion_orden' | 'generacion_interfase' | 'generacion_anexo', valor: string) {
    return this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .where(`grupo.${campo} = :valor`, { valor: valor === 'true' })
      .orderBy('grupo.idGrupoLiquidacion', 'DESC')
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      .leftJoinAndSelect('liquidaciones.ordenServicio', 'ordenServicio')
      .leftJoinAndSelect('ordenServicio.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('ordenServicio.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('ordenServicio.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .getMany();
  }

  async buscarGrupoLiquidaciones() {
    return this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .where(`grupo.estado = :estado`, { estado: false })
      .orderBy('grupo.idGrupoLiquidacion', 'DESC')
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      .leftJoinAndSelect('liquidaciones.ordenServicio', 'ordenServicio')
      .leftJoinAndSelect('ordenServicio.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('ordenServicio.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('ordenServicio.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .getMany();
  }

  async obtenerOrdenesPorCliente(idGrupoLiquidacion: number) {
    const grupoId = Number(idGrupoLiquidacion);
    if (!grupoId || Number.isNaN(grupoId)) {
      throw new BadRequestException('idGrupoLiquidacion inválido');
    }

    const grupo = await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: grupoId },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo de liquidación no encontrado');
    }

    const liquidaciones = await this.repo
      .createQueryBuilder('liq')
      .leftJoinAndSelect('liq.ordenServicio', 'orden')
      .leftJoinAndSelect('orden.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('orden.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('orden.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('orden.tarifas', 'ost')
      .leftJoinAndSelect('ost.idTarifa', 'tarifa')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .leftJoinAndSelect('tarifa.idTipoTarifa', 'tipoTarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .where('liq.idGrupoLiquidacion = :id', { id: grupoId })
      .orderBy('cliente.nombre', 'ASC')
      .addOrderBy('orden.idOrdenServicio', 'ASC')
      .addOrderBy('ost.idOrdenServicioTarifa', 'ASC')
      .getMany();

    const agrupado = new Map<number, ClienteGrupoResumen>();

    for (const liquidacion of liquidaciones) {
      const orden = liquidacion.ordenServicio;
      if (!orden) continue;

      const cliente = orden.idLocacion?.idCliente;
      if (!cliente?.idCliente) continue;

      const entry = agrupado.get(cliente.idCliente) ?? {
        cliente,
        totalLiquidaciones: 0,
        totalOrdenes: 0,
        ordenes: [],
      };

      const valorLiquidacionRaw = Number(liquidacion.valor_liquidacion ?? 0);
      const valorLiquidacion = Number.isFinite(valorLiquidacionRaw) ? valorLiquidacionRaw : 0;
      const totalOrdenRaw = Number(orden.precioTotal ?? 0);
      const totalOrdenServicio = Number.isFinite(totalOrdenRaw) ? totalOrdenRaw : 0;

      entry.totalLiquidaciones += valorLiquidacion;
      entry.totalOrdenes += totalOrdenServicio;

      const servicios = (orden.tarifas ?? [])
        .map((detalle) => detalle?.idTarifa)
        .filter((tarifa): tarifa is Tarifa => Boolean(tarifa));

      entry.ordenes.push({
        liquidacionId: liquidacion.idLiquidacion,
        valorLiquidacion: round2(valorLiquidacion),
        fechaCreacion: liquidacion.fechaCreacion,
        totalOrdenServicio: round2(totalOrdenServicio),
        ordenServicio: orden,
        servicios,
      });

      agrupado.set(cliente.idCliente, entry);
    }

    const clientes = Array.from(agrupado.values())
      .map(({ cliente, ordenes, totalLiquidaciones, totalOrdenes }) => ({
        cliente,
        ordenes,
        totalLiquidaciones: round2(totalLiquidaciones),
        totalOrdenes: round2(totalOrdenes),
      }))
      .sort((a, b) => (a.cliente?.nombre ?? '').localeCompare(b.cliente?.nombre ?? ''));

    return { grupo, clientes };
  }

}
