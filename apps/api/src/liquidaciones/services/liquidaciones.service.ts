import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner, } from 'typeorm';

import { EnviarCorreoDto } from '../../common/dto';
import { EstadoAppInterface } from '../../common/interfaces/estado-app.interface';
import { SendMailOptions } from '../../common/services/email/email.service';

import { TipoServicioInterface } from '../../servicios/interfaces/tipo-servicio.interface';

import { toUTCDateOnly, endOfMonth, minDate, maxDate, diffDaysInclusive, round2 } from '../../common/utils/date-helpers';
import { PrecioOrdenDto } from '../../orden-servicio/dto';

import { EmailService, CorreoDefaultService } from '../../common/services';
import { ReporteConsolidacionService, ReporteInterfaseService, ReporteLiquidacionService, ReporteAnexoFacturacionService } from '../../reportes/services';
import { OrdenServicioService } from '../../orden-servicio/services';

import { OrdenServicio } from '../../orden-servicio/entities';
import { LiquidacionServicioOrdenServicio, Liquidacione, GrupoLiquidacion } from '../entities';

import { UpdateGrupoLiquidacionEstadoDto } from '../dto/updateGrupoLiquidacionEstado.dto';
import { CrearGrupoMensualDto } from '../dto/crearGrupoMensual.dto';
import { ClienteAgrupado } from '../interfaces/consolidacion.interface';

@Injectable()
export class LiquidacionesService {

  constructor(
    @InjectRepository(Liquidacione)
    private readonly liquidacionRepo: Repository<Liquidacione>,
    @InjectRepository(GrupoLiquidacion)
    private readonly grupoLiquidacionrepo: Repository<GrupoLiquidacion>,
    @InjectRepository(OrdenServicio) 
    private readonly ordenRepo: Repository<OrdenServicio>,
    private ordenServicioService: OrdenServicioService,
    private readonly reporteConsolidacionService: ReporteConsolidacionService, // Servicio para generar reportes de consolidacion
    private readonly reporteInterfaseService: ReporteInterfaseService, // Servicio para generar reportes de exportacion de interfase
    private readonly reporteLiquidacionService: ReporteLiquidacionService, // Servicio para generar reportes de liquidacion
    private readonly reporteAnexoFacturacionService: ReporteAnexoFacturacionService, // Servicio para generar reportes de anexos de facturacion
    private readonly emailService: EmailService, // Servicio de email para envio de correos
    private readonly correoDefaultService: CorreoDefaultService, // Servicio para obtener el email por defecto
    private readonly dataSource: DataSource,
  ) { }

  async findAll(params?: { page?: number; limit?: number; ordenId?: number }) {
    const page = Math.max(1, Number(params?.page ?? 1));
    const take = Math.min(100, Math.max(1, Number(params?.limit ?? 20)));
    const skip = (page - 1) * take;

    const qb = this.liquidacionRepo
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

  // Genera grupo y liquidaciones
  async generarGrupoMensual(crearGrupoMensualDto: CrearGrupoMensualDto) {

    const { anio, mes, ordenIds } = crearGrupoMensualDto;

    if (!anio || !mes || mes < 1 || mes > 12 || !ordenIds?.length) {
      throw new BadRequestException('Parámetros inválidos');
    }

    const today = new Date();

    if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes))
     throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    if (today.getMonth() + 1 === mes && today.getDate() < 20)
    throw new BadRequestException('No se puede liquidar antes del 20 del mes actual')

    // Crear QueryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // 1) Crear grupo
      const grupoLiquidacion = queryRunner.manager.create(GrupoLiquidacion, {
        estado: false,
        total: 0
      });

      await queryRunner.manager.save(GrupoLiquidacion, grupoLiquidacion);
      
      // 2) crear liquidaciones del grupo de ordenes
      for (const ordenId of ordenIds) {

        const liquidacionMensualOrden = await this.crearLiquidacionMensualOrden(
          queryRunner, 
          grupoLiquidacion.idGrupoLiquidacion,
          ordenId, 
          anio, 
          mes
        );

      }
      
      // 3) sumar totales de las liquidaciones de las ordenes
      const liquidaciones = await queryRunner.manager.find(Liquidacione, {
        where: { idGrupoLiquidacion: grupoLiquidacion.idGrupoLiquidacion }
      });

      const sum = liquidaciones.reduce((acc, liquidacion) => {
        return acc + Number(liquidacion.valor_liquidacion || 0);
      }, 0);

      grupoLiquidacion.total = Number(sum ?? 0);
      grupoLiquidacion.descripcion = `liquidacion_${mes}_${anio}_${grupoLiquidacion.idGrupoLiquidacion}`

      await queryRunner.manager.save(GrupoLiquidacion, grupoLiquidacion);

      // 4) notificar por correo
      await this.notificarGeneracionLiquidacion(grupoLiquidacion.idGrupoLiquidacion);

      await queryRunner.commitTransaction();

      return grupoLiquidacion;
      
    } catch (error) {

      // Rollback en caso de error
      await queryRunner.rollbackTransaction();

      throw error;
      
    }

    finally {

        // Liberar el QueryRunner
        await queryRunner.release();

    }

  }

  private async crearLiquidacionMensualOrden(
    queryRunner: QueryRunner, 
    idGrupoLiquidacion: number, 
    ordenId: number, 
    anio: number, 
    mes: number
  ){
    
    const ordenServicioLiquidar = await this.ordenRepo
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

    if (!ordenServicioLiquidar) throw new BadRequestException('Orden no encontrada');

    if (ordenServicioLiquidar.fechaFin !== null) {

      const total = Number(ordenServicioLiquidar.precioTotal ?? 0);
      
      const mesIni = new Date(Date.UTC(anio, mes - 1, 1));
      const start = toUTCDateOnly(ordenServicioLiquidar.fechaInicio);
      
      const end = ordenServicioLiquidar.fechaFin ? toUTCDateOnly(ordenServicioLiquidar.fechaFin) : null;
      const mesFin = endOfMonth(mesIni);
      
      const desde = maxDate(start, mesIni);
      const hasta = end ? minDate(end, mesFin) : mesFin;

      if (!isFinite(total) || total <= 0) throw new BadRequestException('PrecioTotal inválido');

      // 2) calcula monto (usa tus helpers reales)

      if (hasta < desde) throw new BadRequestException('La orden no tiene días en el mes solicitado');

      const totalDiasOrden = end ? diffDaysInclusive(start, end) : diffDaysInclusive(start, hasta);
      const diasEnEsteMes = diffDaysInclusive(desde, hasta);

      const startSameMonth = start.getUTCFullYear() === anio && start.getUTCMonth() === (mes - 1);
      const endSameMonth = end ? (end.getUTCFullYear() === anio && end.getUTCMonth() === (mes - 1)) : false;
      const ordenCompletaDentroDelMes = startSameMonth && endSameMonth;

      let totalTarifas = 0;

      // 3) inserta liquidación con FK del grupo
      const liquidacionOrden = queryRunner.manager.create(Liquidacione, {
        valor_liquidacion: 0,
        ordenServicio: ordenServicioLiquidar,
        idGrupoLiquidacion: idGrupoLiquidacion,
        aniomes_liquidacion: `${anio}${mes}`
      })

      await queryRunner.manager.save(Liquidacione, liquidacionOrden);

      for (const tarifa of ordenServicioLiquidar.tarifas ?? []) {
      
        const precioOrden: PrecioOrdenDto = {
          idTarifa: tarifa.idTarifa.idTarifa,
          horaInicio: tarifa.horaInicio,
          horaFin: tarifa.horaFin,
          fechaInicio: desde,
          fechaFin: hasta,
        };

        const {
          
          costosDirectos,
          seguroVida,
          aui,
          costosDirectosSeguroVida,
          precioAntesIva,
          iva,
          precio,
        
        } = await this.ordenServicioService.obtenerPrecio(precioOrden);

        const liquidacionServicio = queryRunner.manager.create(LiquidacionServicioOrdenServicio, {
          idLiquidacion: liquidacionOrden,
          idTarifa: tarifa.idTarifa,
          costosDirectos,
          seguroVida,
          costosDirectosSeguroVida,
          aui,
          precioAntesIva,
          iva,
          precioTotal: precio
        });

        const savedLiquidacionServicio = await queryRunner.manager.save(LiquidacionServicioOrdenServicio, liquidacionServicio);

        totalTarifas += +precio;

      }

      const monto = ordenCompletaDentroDelMes
        ? round2(totalTarifas)
        : round2((totalTarifas * diasEnEsteMes) / totalDiasOrden);

      liquidacionOrden.valor_liquidacion = monto;

      const savedLiquidacionOrden = await queryRunner.manager.save(Liquidacione, liquidacionOrden);

    } 
    
    // INDEFINIDAS
    else if (!ordenServicioLiquidar.fechaFin) {

      const start = toUTCDateOnly(ordenServicioLiquidar.fechaInicio);

      const mesIni = new Date(Date.UTC(anio, mes - 1, 1));
      const mesFin = endOfMonth(mesIni);

      // Validación de solapamiento con el mes
      if (mesFin < start) throw new BadRequestException('La orden no tiene días en el mes solicitado');

      const desde = maxDate(start, mesIni);
      const hasta = mesFin;

      const totalDiasOrden = diffDaysInclusive(start, hasta);
      const diasEnEsteMes = diffDaysInclusive(desde, hasta);

      const startSameMonth = start.getUTCFullYear() === anio && start.getUTCMonth() === (mes - 1);
      const ordenCompletaDentroDelMes = startSameMonth;

      //lógica de orden indefinida.
      let totalTarifas = 0;

      const liquidacionOrden = queryRunner.manager.create(Liquidacione, {
        valor_liquidacion: 0,
        ordenServicio: ordenServicioLiquidar,
        idGrupoLiquidacion: idGrupoLiquidacion,
        aniomes_liquidacion: `${anio}${mes}`
      })
      
      await queryRunner.manager.save(Liquidacione, liquidacionOrden);

      for (const tarifa of ordenServicioLiquidar.tarifas ?? []) {
      
        const precioOrden: PrecioOrdenDto = {
          idTarifa: tarifa.idTarifa.idTarifa,
          horaInicio: tarifa.horaInicio,
          horaFin: tarifa.horaFin,
          fechaInicio: desde,
          fechaFin: hasta,
        };

        const {
          
          costosDirectos,
          seguroVida,
          aui,
          costosDirectosSeguroVida,
          precioAntesIva,
          iva,
          precio,
        
        } = await this.ordenServicioService.obtenerPrecio(precioOrden);

        const liquidacionServicio = queryRunner.manager.create(LiquidacionServicioOrdenServicio, {
          idLiquidacion: liquidacionOrden,
          idTarifa: tarifa.idTarifa,
          costosDirectos,
          seguroVida,
          costosDirectosSeguroVida,
          aui,
          precioAntesIva,
          iva,
          precioTotal: precio
        });

        const savedLiquidacionServicio = await queryRunner.manager.save(LiquidacionServicioOrdenServicio, liquidacionServicio);

        totalTarifas += +precio;

      }

      // if (!totalTarifas || totalTarifas <= 0) throw new Error('Precio de tarifas inválido');

      const monto = ordenCompletaDentroDelMes
        ? round2(totalTarifas)
        : round2((totalTarifas * diasEnEsteMes) / totalDiasOrden);

      liquidacionOrden.valor_liquidacion = monto;

      const savedLiquidacionOrden = await queryRunner.manager.save(Liquidacione, liquidacionOrden);

    }

  }

  async findByCreacionMes(anio: number, mes1a12: number) {

    if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
      throw new BadRequestException('Parámetros inválidos (anio, mes)');
    }

    const today = new Date();
    if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes1a12))
      throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

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

  async findByMesLiquidacionesAprobadas(anio: number, mes1a12: number) {
    if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
      throw new BadRequestException('Parámetros inválidos (anio, mes)');
    }

    // const today = new Date();
    // if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes1a12))
    //   throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    // Rango del mes objetivo: [inicioMes, finMes)
    const inicioMes = new Date(Date.UTC(anio, mes1a12 - 1, 1, 0, 0, 0));
    const finMes = new Date(Date.UTC(anio, mes1a12, 1, 0, 0, 0)); // inicio del mes siguiente

    return this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .where(`grupo.estado = :estado`, { estado: true })
      .andWhere('grupo.fechaCreacion < :fin AND (grupo.fechaCreacion >= :ini)', {
        ini: inicioMes,
        fin: finMes,
      })
      .orderBy('grupo.idGrupoLiquidacion', 'DESC')
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      .leftJoinAndSelect('liquidaciones.ordenServicio', 'ordenServicio')
      .leftJoinAndSelect('ordenServicio.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('ordenServicio.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('ordenServicio.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .getMany();
  }


  async findByEstado(estado: boolean) {
    return this.grupoLiquidacionrepo.find({
      where: { estado },
      order: { idGrupoLiquidacion: 'DESC' },
    });
  }

  
  
  async liquidarGrupo(idGrupoLiquidacion: number) {

    // Crear QueryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const grupoLiquidacion = await this.grupoLiquidacionrepo.findOneBy({idGrupoLiquidacion});

    if (!grupoLiquidacion) throw new NotFoundException('Grupo de liquidación no encontrado');

    try {

      grupoLiquidacion.estado = true;

      await queryRunner.manager.save(GrupoLiquidacion, grupoLiquidacion);
      
      await queryRunner.manager
        .createQueryBuilder()
        .update(Liquidacione)
        .set({ estado: true })
        .where('idGrupoLiquidacion = :idGrupoLiquidacion', { idGrupoLiquidacion })
        .execute();
  
      await this.notificarAprobacionLiquidacion(grupoLiquidacion.idGrupoLiquidacion);

      await queryRunner.commitTransaction();

      return {
        ok: true,
        grupoId: idGrupoLiquidacion,
        mensaje: 'Grupo de liquidación y sus liquidaciones aprobadas correctamente',
      };
      
    } catch (error) {

      await queryRunner.rollbackTransaction();
      
      throw error;
      
    } finally {

      await queryRunner.release();

    }
  
  }

  async desintegrarGrupo(idGrupoLiquidacion: number) {

    // Crear QueryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();
  
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      // 1️⃣ Buscar el grupo
      const grupoLiquidacion = await queryRunner.manager.findOne(GrupoLiquidacion, {
        where: { idGrupoLiquidacion },
      });
  
      if (!grupoLiquidacion) {
        throw new NotFoundException('Grupo de liquidación no encontrado');
      }
  
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Liquidacione)
        .where('idGrupoLiquidacion = :id', { id: idGrupoLiquidacion })
        .execute();
  
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(GrupoLiquidacion)
        .where('idGrupoLiquidacion = :id', { id: idGrupoLiquidacion })
        .execute();
  
      await this.notificarDesaprobacionLiquidacion(grupoLiquidacion.idGrupoLiquidacion);

      await queryRunner.commitTransaction();
  
      return {
        ok: true,
        grupoId: idGrupoLiquidacion,
        mensaje: 'Grupo de liquidación y sus liquidaciones eliminadas correctamente',
      };

    } catch (error) {
      
      await queryRunner.rollbackTransaction();
      
      throw error;
    
    } finally {

      await queryRunner.release();

    }

  }
  

  async actualizarCampoGrupoEstado(id: number, dto: UpdateGrupoLiquidacionEstadoDto) {

    const grupo = await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: id },
    });

    if (!grupo) throw new NotFoundException('Grupo de liquidación no encontrado');

    grupo[dto.campo] = dto.valor === 'true';

    await this.grupoLiquidacionrepo.save(grupo);

    return {
      ok: true,
      grupoId: id,
      campoActualizado: dto.campo,
      nuevoValor: dto.valor,
    };

  }

  async findGruposPorCampoEstado(campo: 'consolidacion_orden' | 'generacion_interfase' | 'generacion_anexo', valor: string) {
    
    const query = this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .orderBy('grupo.idGrupoLiquidacion', 'DESC')
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      .leftJoinAndSelect('liquidaciones.ordenServicio', 'ordenServicio')
      .leftJoinAndSelect('ordenServicio.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('ordenServicio.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('ordenServicio.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')

      if (campo === 'consolidacion_orden') {
        query.where(`grupo.consolidacion_orden = :valor`, { valor: valor === 'true' });
      }


      if (campo === 'generacion_interfase') {
        query.where('grupo.consolidacion_orden = :cons', { cons: true })
             .andWhere('grupo.generacion_interfase = :valor', { valor: valor === 'true' });
      }
    
      if (campo === 'generacion_anexo') {
        query.where('grupo.consolidacion_orden = :cons', { cons: true })
             .andWhere('grupo.generacion_interfase = :interfase', { interfase: true })
             .andWhere('grupo.generacion_anexo = :valor', { valor: valor === 'true' });
      }
    
      return query.getMany();
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

  async obtenerServiciosPorCliente(idGrupoLiquidacion: number) {

    const grupoId = Number(idGrupoLiquidacion);
    
    if (!grupoId || Number.isNaN(grupoId)) {
      throw new BadRequestException('idGrupoLiquidacion inválido');
    }

    const grupo = await this.grupoLiquidacionrepo.findOne({
      where: { 
        idGrupoLiquidacion: grupoId 
      },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo de liquidación no encontrado');
    }

    const liquidaciones = await this.liquidacionRepo
      .createQueryBuilder('liq')
      .leftJoinAndSelect('liq.ordenServicio', 'orden')
      .leftJoinAndSelect('liq.liquidacionServiciosOrdenServicio', 'liqsos')
      .leftJoinAndSelect('liqsos.idTarifa', 'tarifaLiq')
      .leftJoinAndSelect('tarifaLiq.idServicio', 'servicioLiq')
      .leftJoinAndSelect('servicioLiq.idTipoServicio', 'tipoServicioLiq')
      .leftJoinAndSelect('orden.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('orden.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('orden.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('orden.tarifas', 'ost')
      .leftJoinAndSelect('ost.idTarifa', 'tarifa')
      .leftJoinAndSelect('tarifa.idPeriodo', 'periodo')
      .where('liq.idGrupoLiquidacion = :id', { id: grupoId })
      .orderBy('cliente.nombre', 'ASC')
      .addOrderBy('orden.idOrdenServicio', 'ASC')
      .addOrderBy('ost.idOrdenServicioTarifa', 'ASC')
      .getMany();

    console.log(`Liquidaciones encontradas para el grupo ${grupoId}: ${liquidaciones.length}`);
    
    // 🔹 Agrupar por cliente y servicio
    const agrupado: Record<number, ClienteAgrupado> = {};

    // return liquidaciones;
    
    for (const liq of liquidaciones) {

      const cliente = liq.ordenServicio.idLocacion.idCliente;

      const clienteId = cliente.idCliente;
      const clienteNombre = cliente.nombre;
      const clienteNit = cliente.numeroIdentificacion;
    
      if (!agrupado[clienteId]) {

        agrupado[clienteId] = {
          cliente: clienteNombre,
          numeroId: clienteNit,
          servicios: {},
          totalOrdenes: 0,
          totalLiquidarAplicacion: 0,
          totalSeguroVida: 0,
          totalAui: 0,
          totalTarifaAntesIva: 0,
          totalIvaAui: 0,
          totalTarifaConIva: 0
        };

      }
    
      for (const liquidacionServicioOrdenServicio of liq.liquidacionServiciosOrdenServicio) {

        const tarifa = liquidacionServicioOrdenServicio.idTarifa; 
        const servicio = liquidacionServicioOrdenServicio.idTarifa.idServicio;
    
        if (!agrupado[clienteId].servicios[tarifa.idTarifa]) {

          agrupado[clienteId].servicios[tarifa.idTarifa] = {
            tipoServicio: servicio.idTipoServicio.requierePersonal ? TipoServicioInterface.ARMADO : TipoServicioInterface.MONITOREO,
            servicioAplicacion: servicio.descripcion,
            codigoServicioSiigo: servicio.codigo,
            valorLiquidarAplicacion: 0,
            seguroVida: 0,
            aui: 0,
            tarifaAntesIva: 0,
            auiIVa: 0,
            tarifaConIva: 0,
            cantidadOrdenes: 0
          };

        }
    
        agrupado[clienteId].servicios[tarifa.idTarifa].cantidadOrdenes += 1; 

        agrupado[clienteId].servicios[tarifa.idTarifa].valorLiquidarAplicacion += Number(liquidacionServicioOrdenServicio.costosDirectos);        
        agrupado[clienteId].servicios[tarifa.idTarifa].seguroVida += Number(liquidacionServicioOrdenServicio.seguroVida);        
        agrupado[clienteId].servicios[tarifa.idTarifa].aui += Number(liquidacionServicioOrdenServicio.aui);                
        agrupado[clienteId].servicios[tarifa.idTarifa].tarifaAntesIva += (Number(liquidacionServicioOrdenServicio.costosDirectos) + Number(liquidacionServicioOrdenServicio.seguroVida) + Number(liquidacionServicioOrdenServicio.aui));                
        agrupado[clienteId].servicios[tarifa.idTarifa].auiIVa += (Number(liquidacionServicioOrdenServicio.aui) * 0.19);                
        agrupado[clienteId].servicios[tarifa.idTarifa].tarifaConIva += (Number(liquidacionServicioOrdenServicio.costosDirectos) + Number(liquidacionServicioOrdenServicio.seguroVida) + Number(liquidacionServicioOrdenServicio.aui) + (Number(liquidacionServicioOrdenServicio.aui) * 0.19));                

      }

      agrupado[clienteId].totalOrdenes += 1;

    }

    // 🔹 Calcular totales finales por cliente
    for (const cliente of Object.values(agrupado)) {
      for (const servicio of Object.values(cliente.servicios)) {
        cliente.totalSeguroVida += servicio.seguroVida;
        cliente.totalAui += servicio.aui;
        cliente.totalTarifaAntesIva += servicio.tarifaAntesIva;
        cliente.totalIvaAui += servicio.auiIVa;
        cliente.totalTarifaConIva += servicio.tarifaConIva;
        cliente.totalLiquidarAplicacion += servicio.valorLiquidarAplicacion;
      }
    }

    const clientesAgrupados = Object.values(agrupado);

    return clientesAgrupados;
    
  }

  async downloadConsolidacionExcel(idGrupoLiquidacion: number){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const excelBuffer = await this.reporteConsolidacionService.generateExcel(resultado);

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    if (grupoLiquidacion.consolidacion_orden != true){

      await this.notificarGeneracionConsolidacion(idGrupoLiquidacion, excelBuffer);
      
    }

    // cambiar estado a TRUE
    await this.actualizarCampoGrupoEstado(idGrupoLiquidacion, {
      campo: 'consolidacion_orden',
      valor: 'true'      
    });

    return {
      excelBuffer: excelBuffer,
      title: `consolidacion_grupo_${idGrupoLiquidacion}`
    };    

  }
  
  async downloadInterfaseExcel(idGrupoLiquidacion: number){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    const fechaCreacion = grupoLiquidacion.fechaCreacion;

    const anioCreacion = fechaCreacion.getFullYear();       // Año completo (por ejemplo, 2025)
    const mesCreacion = fechaCreacion.getMonth() + 1;       // Mes (0 = enero, por eso se suma 1)
    const diaCreacion = fechaCreacion.getDate()

    const excelBuffer = await this.reporteInterfaseService.generateExcel(resultado, mes, anio, mesCreacion, diaCreacion, anioCreacion);

    if (grupoLiquidacion.generacion_interfase != true){

      await this.notificarGeneracionInterfase(idGrupoLiquidacion, excelBuffer);
      
    }

    // cambiar estado a TRUE
    await this.actualizarCampoGrupoEstado(idGrupoLiquidacion, {
      campo: 'generacion_interfase',
      valor: 'true'      
    })

    return {
      excelBuffer: excelBuffer,
      title: `exportacion_grupo_${idGrupoLiquidacion}`
    };    

  }
  
  async downloadLiquidacionExcel(idGrupoLiquidacion: number){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const excelBuffer = await this.reporteLiquidacionService.generateExcel(resultado);

    return {
      excelBuffer: excelBuffer,
      title: `liquidacion_grupo_${idGrupoLiquidacion}`
    };    

  }
  
  async downloadAnexoZip(idGrupoLiquidacion: number){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const zipBuffer = await this.reporteAnexoFacturacionService.generateZip(resultado);

    // cambiar estado a TRUE
    await this.actualizarCampoGrupoEstado(idGrupoLiquidacion, {
      campo: 'generacion_anexo',
      valor: 'true'      
    })

    return {
      zipBuffer: zipBuffer,
      title: `anexos_facturacion_grupo_${idGrupoLiquidacion}`
    };    

  }

  async sendConsolidacionExcel(idGrupoLiquidacion: number, enviarCorreoDto: EnviarCorreoDto){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const excelBuffer = await this.reporteConsolidacionService.generateExcel(resultado);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Consolidacion del grupo de liquidacion ${idGrupoLiquidacion}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CONSOLIDACION ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia EXCEL adjunto con consolidacion del <b>grupo de liquidacion ${idGrupoLiquidacion}</b> de ordenes de servicio. <br><br>
              Por favor, revise el <b>EXCEL adjunto</b> para más detalles.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;

    const emails = enviarCorreoDto.correos.map(correo => correo.email);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `consolidacion-grupo-${idGrupoLiquidacion}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo con consolidacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }
  
  async sendInterfaseExcel(idGrupoLiquidacion: number, enviarCorreoDto: EnviarCorreoDto){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    const fechaCreacion = grupoLiquidacion.fechaCreacion;

    const anioCreacion = fechaCreacion.getFullYear();       // Año completo (por ejemplo, 2025)
    const mesCreacion = fechaCreacion.getMonth() + 1;       // Mes (0 = enero, por eso se suma 1)
    const diaCreacion = fechaCreacion.getDate()

    const excelBuffer = await this.reporteInterfaseService.generateExcel(resultado, mes, anio, mesCreacion, diaCreacion, anioCreacion);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Exportacion del grupo de liquidacion ${idGrupoLiquidacion}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">EXPORTACION ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia EXCEL adjunto con exportacion del <b>grupo de liquidacion ${idGrupoLiquidacion}</b> de ordenes de servicio. <br><br>
              Por favor, revise el <b>EXCEL adjunto</b> para más detalles.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;

    const emails = enviarCorreoDto.correos.map(correo => correo.email);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `exportacion-grupo-${idGrupoLiquidacion}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo con exportacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }
  
  async sendLiquidacionExcel(idGrupoLiquidacion: number, enviarCorreoDto: EnviarCorreoDto){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const excelBuffer = await this.reporteLiquidacionService.generateExcel(resultado);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Liquidacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">LIQUIDACION del grupo de liquidacion ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia EXCEL adjunto con liquidacion del <b>grupo de liquidacion ${idGrupoLiquidacion}</b> de ordenes de servicio. <br><br>
              Por favor, revise el <b>EXCEL adjunto</b> para más detalles.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;

    const emails = enviarCorreoDto.correos.map(correo => correo.email);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `liquidacion-grupo-${idGrupoLiquidacion}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo con liquidacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }

  async sendAnexoZip(idGrupoLiquidacion: number, enviarCorreoDto: EnviarCorreoDto){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const zipBuffer = await this.reporteAnexoFacturacionService.generateZip(resultado);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Anexos de facturacion del grupo de liquidacion ${idGrupoLiquidacion}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Anexos facturacion del grupo ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia archivo adjunto con anexos de facturacion del <b>grupo de liquidacion ${idGrupoLiquidacion}</b> de ordenes de servicio. <br><br>
              Por favor, revise el <b>archivo adjunto</b> para más detalles.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;

    const emails = enviarCorreoDto.correos.map(correo => correo.email);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `anexos_facturacion_grupo_${idGrupoLiquidacion}.zip`,
          content: zipBuffer,
          contentType: 'application/zip',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo con anexos de facturacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }

  async notificarGeneracionConsolidacion(idGrupoLiquidacion: number, excelBuffer: Buffer){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): se ha generado una Consolidacion del grupo de liquidacion ${idGrupoLiquidacion}`;
  
    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CONSOLIDACION ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia EXCEL adjunto con consolidacion del <b>grupo de liquidacion ${idGrupoLiquidacion}</b> de ordenes de servicio. <br><br>
              Por favor, revise el <b>EXCEL adjunto</b> para más detalles. <br><br>
              Ya esta disponible la generacion del archivo de interfase para el grupo de liquidacion ${idGrupoLiquidacion}.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;
  
    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_CONSOLIDACION);
  
    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `consolidacion-grupo-${idGrupoLiquidacion}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    }
  
    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);
  
    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo con consolidacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }
  
  }
  
  async notificarGeneracionInterfase(idGrupoLiquidacion: number, excelBuffer: Buffer){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): se ha generado una Exportacion del grupo de liquidacion ${idGrupoLiquidacion}`;
  
    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">EXPORTACION ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia EXCEL adjunto con exportacion del <b>grupo de liquidacion ${idGrupoLiquidacion}</b> de ordenes de servicio. <br><br>
              Por favor, revise el <b>EXCEL adjunto</b> para más detalles. <br><br>
              Ya esta disponible la generacion de los anexos de facturacion para el grupo de liquidacion ${idGrupoLiquidacion}.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;
  
    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_INTERFASE);
  
    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `exportacion-grupo-${idGrupoLiquidacion}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    }
  
    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);
  
    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo con exportacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }
  
  }
  
  async notificarGeneracionLiquidacion(idGrupoLiquidacion: number){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): se ha generado un nuevo grupo de liquidacion de ordenes de servicio`;
  
    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">GRUPO LIQUIDACION ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se notifica creacion de un nuevo grupo de liquidacion de ordenes de servicio. <br><br> 
              Numero de grupo de liquidacion de ordenes de servicio creado: <b>${idGrupoLiquidacion}</b>. <br><br>
              Se debe esperar <b>aprobacion</b> para el grupo de liquidacion ${idGrupoLiquidacion}.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;
  
    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_LIQUIDACION);
  
    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html
    }
  
    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);
  
    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de creacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }
  
  }
  
  async notificarAprobacionLiquidacion(idGrupoLiquidacion: number){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): se ha aprobado liquidacion para el grupo ${idGrupoLiquidacion} de ordenes de servicio`;
  
    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">APROBACION GRUPO LIQUIDACION ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se notifica aprobacion de liquidacion para el grupo ${idGrupoLiquidacion} de ordenes de servicio. <br><br> 
              Numero de grupo de liquidacion de ordenes de servicio aprobado: <b>${idGrupoLiquidacion}</b>. <br><br>
              Ya esta disponible la generacion del archivo de consolidacion para el grupo de liquidacion ${idGrupoLiquidacion}.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;
  
    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.APROBACION_DESAPROBACION_LIQUIDACION);
  
    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html
    }
  
    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);
  
    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de aprobacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }
  
  }
  
  async notificarDesaprobacionLiquidacion(idGrupoLiquidacion: number){
  
    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): se ha desaprobado liquidacion para el grupo ${idGrupoLiquidacion} de ordenes de servicio`;
  
    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">DESAPROBACION GRUPO LIQUIDACION ${idGrupoLiquidacion}</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se notifica desaprobacion de liquidacion para el grupo ${idGrupoLiquidacion} de ordenes de servicio. <br><br> 
              Numero de grupo de liquidacion de ordenes de servicio desaprobado: <b>${idGrupoLiquidacion}</b>. <br><br>
              Las ordenes de servicio de este grupo vuelven a estar disponibles para liquidar.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;
  
    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.APROBACION_DESAPROBACION_LIQUIDACION);
  
    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html
    }
  
    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);
  
    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo de notificacion de desaprobacion del grupo de liquidacion ${idGrupoLiquidacion} de ordenes de servicio a los emails ${emails}, revisar correos si estan bien escritos`);
    }
  
  }

}
