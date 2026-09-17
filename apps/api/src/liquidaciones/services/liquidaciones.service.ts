import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner, } from 'typeorm';

import { EnviarCorreoDto } from '../../common/dto';
import { EstadoAppInterface } from '../../common/interfaces/estado-app.interface';
import { SendMailOptions } from '../../common/services/email/email.service';

import { TipoServicioInterface } from '../../servicios/interfaces/tipo-servicio.interface';

import { toUTCDateOnly, endOfMonth, minDate, maxDate, round2 } from '../../common/utils/date-helpers';
import { PrecioOrdenDto } from '../../orden-servicio/dto';
import { OrigenServicioEnum } from '../../orden-servicio/interfaces/origen-servicio.interface';

import { EmailService, CorreoDefaultService } from '../../common/services';
import { ReporteConsolidacionService, ReporteInterfaseService, ReporteLiquidacionService, ReporteAnexoFacturacionService } from '../../reportes/services';
import { OrdenServicioService } from '../../orden-servicio/services';
import { ClientesService } from '../../clientes/services';

import { OrdenServicio } from '../../orden-servicio/entities';
import { LiquidacionServicioOrdenServicio, Liquidacione, GrupoLiquidacion, NumeroPedido } from '../entities';

import { UpdateGrupoLiquidacionEstadoDto } from '../dto/updateGrupoLiquidacionEstado.dto';
import { CrearGrupoMensualDto } from '../dto/crearGrupoMensual.dto';
import { ClienteAgrupado } from '../interfaces/consolidacion.interface';
import { LiquidacionClienteAgrupado } from '../interfaces/liquidacion.interface';

@Injectable()
export class LiquidacionesService {

  constructor(
    @InjectRepository(Liquidacione)
    private readonly liquidacionRepo: Repository<Liquidacione>,
    @InjectRepository(GrupoLiquidacion)
    private readonly grupoLiquidacionrepo: Repository<GrupoLiquidacion>,
    @InjectRepository(OrdenServicio) 
    private readonly ordenRepo: Repository<OrdenServicio>,
    @InjectRepository(NumeroPedido) 
    private readonly numeroPedidoRepository: Repository<NumeroPedido>,
    private ordenServicioService: OrdenServicioService,
    private readonly clienteService: ClientesService,
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

  // DEVUELVE UNA ORDEN DE SERVICIO "COMO EL FINDONE NORMAL" PERO CON LOS PRECIOS DE UNA LIQUIDACION ESPECIFICA
  // (lo que realmente se cobro ese mes), en vez de los precios totales de la orden completa.
  //
  // CATALOGO: se toman los valores ya guardados en liquidacionServiciosOrdenServicio (recalculados por
  // crearLiquidacionMensualOrden para el tramo del mes) y se les completa horaInicio/horaFin cruzando por idTarifa
  // contra los detalles de la orden (sin ambiguedad: catalogo tiene una sola fila por idTarifa).
  //
  // A LA MEDIDA: liquidacionServiciosOrdenServicio no guarda fecha/horaInicio/horaFin (solo el precio ya copiado),
  // asi que en vez de usarla se recalcula el mismo desde/hasta que uso crearLiquidacionMensualOrden y se filtran
  // directamente los detalles de la orden por fecha: esas filas ya tienen su horario real de ese dia especifico.
  async findOrdenLiquidada(idLiquidacion: number) {

    const liquidacion = await this.liquidacionRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.liquidacionServiciosOrdenServicio', 'lsos')
      .leftJoinAndSelect('lsos.idTarifa', 'lsosTarifa')
      .leftJoinAndSelect('lsosTarifa.idServicio', 'lsosServicio')
      // idTipoServicio/idTipoDuracion/idTipoTarifa/idTipoHorarioDescripcion son "eager: true" en Servicio,
      // pero eso solo aplica cuando se consulta con el repository (find/findOne, ver findOneOrdenRelations);
      // con createQueryBuilder hay que unirlas a mano o quedan sin cargar (undefined) en la respuesta
      .leftJoinAndSelect('lsosServicio.idTipoServicio', 'lsosServicioTipoServicio')
      .leftJoinAndSelect('lsosServicio.idTipoDuracion', 'lsosServicioTipoDuracion')
      .leftJoinAndSelect('lsosServicio.idTipoTarifa', 'lsosServicioTipoTarifa')
      .leftJoinAndSelect('lsosServicio.idTipoHorarioDescripcion', 'lsosServicioTipoHorario')
      .leftJoinAndSelect('l.ordenServicio', 'os')
      .leftJoinAndSelect('os.ordenServicioId', 'osid')
      .leftJoinAndSelect('os.idUsuarioCreacion', 'usuario')
      .leftJoinAndSelect('os.idEstadoOrdenServicio', 'estado')
      .leftJoinAndSelect('os.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.correos', 'correos')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('cliente.idTipoCliente', 'tipoCliente')
      .leftJoinAndSelect('locacion.idCiudad', 'ciudad')
      .leftJoinAndSelect('os.idCliente', 'clienteDirecto')
      .leftJoinAndSelect('clienteDirecto.idTipoCliente', 'clienteDirectoTipoCliente')
      .leftJoinAndSelect('os.detalles', 'detalle')
      .leftJoinAndSelect('detalle.idTarifa', 'detalleTarifa')
      .leftJoinAndSelect('detalleTarifa.idServicio', 'detalleServicio')
      .leftJoinAndSelect('detalleServicio.idTipoServicio', 'detalleServicioTipoServicio')
      .leftJoinAndSelect('detalleServicio.idTipoDuracion', 'detalleServicioTipoDuracion')
      .leftJoinAndSelect('detalleServicio.idTipoTarifa', 'detalleServicioTipoTarifa')
      .leftJoinAndSelect('detalleServicio.idTipoHorarioDescripcion', 'detalleServicioTipoHorario')
      .where('l.idLiquidacion = :id', { id: idLiquidacion })
      .getOne();

    if (!liquidacion)
      throw new NotFoundException(`Liquidacion con id "${idLiquidacion}" no se ha encontrado`);

    const anio = Number(liquidacion.aniomes_liquidacion.slice(0, 4));
    const mes = Number(liquidacion.aniomes_liquidacion.slice(4));

    const mesIni = new Date(Date.UTC(anio, mes - 1, 1));
    const mesFin = endOfMonth(mesIni);
    const start = toUTCDateOnly(liquidacion.ordenServicio.fechaInicio);
    const end = liquidacion.ordenServicio.fechaFin ? toUTCDateOnly(liquidacion.ordenServicio.fechaFin) : mesFin;

    const desde = maxDate(start, mesIni);
    const hasta = minDate(end, mesFin);

    const esCatalogo = liquidacion.ordenServicio.origenServicio === OrigenServicioEnum.CATALOGO;

    const detallesOrden = liquidacion.ordenServicio.detalles ?? [];

    const detalles = esCatalogo
      ? liquidacion.liquidacionServiciosOrdenServicio.map(lsos => {
          const detalleOrden = detallesOrden.find(d => d.idTarifa.idTarifa === lsos.idTarifa.idTarifa);
          return {
            idTarifa: lsos.idTarifa,
            fecha: null,
            horaInicio: detalleOrden?.horaInicio ?? null,
            horaFin: detalleOrden?.horaFin ?? null,
            // Dias de la semana del detalle original de la orden (lsos no los tiene, es el snapshot de precio
            // liquidado). Por defecto true igual que en la entidad, para filas anteriores a esta funcionalidad
            lunes: detalleOrden?.lunes ?? true,
            martes: detalleOrden?.martes ?? true,
            miercoles: detalleOrden?.miercoles ?? true,
            jueves: detalleOrden?.jueves ?? true,
            viernes: detalleOrden?.viernes ?? true,
            sabado: detalleOrden?.sabado ?? true,
            domingo: detalleOrden?.domingo ?? true,
            incluyeFestivos: detalleOrden?.incluyeFestivos ?? true,
            costosDirectos: lsos.costosDirectos,
            seguroVida: lsos.seguroVida,
            costosDirectosSeguroVida: lsos.costosDirectosSeguroVida,
            aui: lsos.aui,
            precioAntesIva: lsos.precioAntesIva,
            iva: lsos.iva,
            precio: lsos.precioTotal,
          };
        })
      : detallesOrden
          .filter(d => d.fecha && toUTCDateOnly(d.fecha) >= desde && toUTCDateOnly(d.fecha) <= hasta)
          .sort((a, b) => +new Date(a.fecha!) - +new Date(b.fecha!))
          .map(d => ({
            idTarifa: d.idTarifa,
            fecha: d.fecha,
            horaInicio: d.horaInicio,
            horaFin: d.horaFin,
            lunes: d.lunes,
            martes: d.martes,
            miercoles: d.miercoles,
            jueves: d.jueves,
            viernes: d.viernes,
            sabado: d.sabado,
            domingo: d.domingo,
            incluyeFestivos: d.incluyeFestivos,
            costosDirectos: d.costosDirectos,
            seguroVida: d.seguroVida,
            costosDirectosSeguroVida: d.costosDirectosSeguroVida,
            aui: d.aui,
            precioAntesIva: d.precioAntesIva,
            iva: d.iva,
            precio: d.precio,
          }));

    const { detalles: _detallesOrden, liquidaciones: _liquidacionesOrden, ...ordenServicioBase } = liquidacion.ordenServicio as any;

    return {
      ...ordenServicioBase,
      fechaInicio: desde,
      fechaFin: hasta,
      precioTotal: liquidacion.valor_liquidacion,
      detalles,
      idLiquidacion: liquidacion.idLiquidacion,
      aniomes_liquidacion: liquidacion.aniomes_liquidacion,
    };

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

    // if (today.getMonth() + 1 === mes && today.getDate() < 20)
    //   throw new BadRequestException('No se puede liquidar antes del 20 del mes actual')

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

  // CREA LA LIQUIDACION MENSUAL DE UNA ORDEN DE SERVICIO PARA EL MES/ANIO INDICADO.
  //
  // CATALOGO: cada fila del desglose (OrdenServicioDetalle) cubre TODO el rango de fechas de la orden (no un dia
  // especifico), asi que su precio se puede recalcular pidiendole a obtenerPrecio el tramo "desde-hasta" que cae
  // dentro del mes que se esta liquidando (dias * tarifa), sin importar la hora.
  //
  // A LA MEDIDA: cada fila del desglose YA es un dia especifico con su precio ya calculado y guardado (ver
  // calcularPrecioAMedida), por lo que aca NO se recalcula nada; solo se toman las filas cuya "fecha" cae dentro del
  // mes que se esta liquidando y se usan sus valores tal cual (esto es lo que requiere el "trato especial" por horas:
  // una orden de 3 dias que cruza de mes debe repartir cada dia al mes que le corresponde, no prorratear el total)
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
      .leftJoinAndSelect('os.detalles', 'detalles')
      .leftJoinAndSelect('detalles.idTarifa', 'tarifa')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .where('os.idOrdenServicio = :id', { id: ordenId })
      .andWhere('estado.nombre <> :estado', { estado: 'ANULADA' })
      .orderBy('detalles.idOrdenServicioDetalle', 'ASC')
      .getOne()

    if (!ordenServicioLiquidar) throw new BadRequestException('Orden no encontrada');

    const esCatalogo = ordenServicioLiquidar.origenServicio === OrigenServicioEnum.CATALOGO;

    const mesIni = new Date(Date.UTC(anio, mes - 1, 1));
    const mesFin = endOfMonth(mesIni);
    const start = toUTCDateOnly(ordenServicioLiquidar.fechaInicio);

    let desde: Date;
    let hasta: Date;

    if (ordenServicioLiquidar.fechaFin !== null) {

      const total = Number(ordenServicioLiquidar.precioTotal ?? 0);

      const end = toUTCDateOnly(ordenServicioLiquidar.fechaFin);

      desde = maxDate(start, mesIni);
      hasta = minDate(end, mesFin);

      if (!isFinite(total) || total <= 0) throw new BadRequestException('PrecioTotal inválido');

      if (hasta < desde) throw new BadRequestException('La orden no tiene días en el mes solicitado');

    } else {

      // ORDENES INDEFINIDAS: no aplica para "a la medida" (esas siempre requieren fecha de fin, ver validacion al crear)
      if (!esCatalogo) {
        throw new BadRequestException('No se puede liquidar una orden a la medida indefinida (sin fecha de fin)');
      }

      if (mesFin < start) throw new BadRequestException('La orden no tiene días en el mes solicitado');

      desde = maxDate(start, mesIni);
      hasta = mesFin;

    }

    let totalTarifas = 0;

    const liquidacionOrden = queryRunner.manager.create(Liquidacione, {
      valor_liquidacion: 0,
      ordenServicio: ordenServicioLiquidar,
      idGrupoLiquidacion: idGrupoLiquidacion,
      // Formato fijo "YYYYMM" (mes con cero a la izquierda): sin el padStart, meses 1-9 quedaban con 5
      // caracteres (ej "20269" para septiembre/2026) y rompian cualquier lectura que asuma ancho fijo
      // (ver formatAniomes en el front, mostraba "N/A")
      aniomes_liquidacion: `${anio}${String(mes).padStart(2, '0')}`
    })

    await queryRunner.manager.save(Liquidacione, liquidacionOrden);

    for (const detalle of ordenServicioLiquidar.detalles ?? []) {

      let costosDirectos: number, seguroVida: number, aui: number, costosDirectosSeguroVida: number, precioAntesIva: number, iva: number, precio: number;

      if (esCatalogo) {

        // CATALOGO: la fila cubre todo el rango de la orden, se recalcula para el tramo "desde-hasta" de este mes.
        // obtenerPrecio ya calcula el valor exacto para ese rango (dias * tarifa), no hay que volver a prorratear
        const precioOrden: PrecioOrdenDto = {
          origenServicio: OrigenServicioEnum.CATALOGO,
          fechaInicio: desde,
          fechaFin: hasta,
          servicios: [{
            idTarifa: detalle.idTarifa.idTarifa,
            horaInicio: detalle.horaInicio,
            horaFin: detalle.horaFin,
            lunes: detalle.lunes,
            martes: detalle.martes,
            miercoles: detalle.miercoles,
            jueves: detalle.jueves,
            viernes: detalle.viernes,
            sabado: detalle.sabado,
            domingo: detalle.domingo,
            incluyeFestivos: detalle.incluyeFestivos,
          }],
        };

        const resultado = await this.ordenServicioService.obtenerPrecio(precioOrden);

        costosDirectos = resultado.costosDirectos;
        seguroVida = resultado.seguroVida;
        aui = resultado.aui;
        costosDirectosSeguroVida = resultado.costosDirectosSeguroVida;
        precioAntesIva = resultado.precioAntesIva;
        iva = resultado.iva;
        precio = resultado.precio;

      } else {

        // A LA MEDIDA: la fila ya es un dia especifico con su precio ya calculado. Si su fecha no cae en el mes
        // que se esta liquidando, se omite (le corresponde a otro mes); si cae, se usa el valor ya guardado tal cual
        if (!detalle.fecha) continue;

        const fechaDetalle = toUTCDateOnly(detalle.fecha);

        if (fechaDetalle < desde || fechaDetalle > hasta) continue;

        costosDirectos = Number(detalle.costosDirectos ?? 0);
        seguroVida = Number(detalle.seguroVida ?? 0);
        aui = Number(detalle.aui ?? 0);
        costosDirectosSeguroVida = Number(detalle.costosDirectosSeguroVida ?? 0);
        precioAntesIva = Number(detalle.precioAntesIva ?? 0);
        iva = Number(detalle.iva ?? 0);
        precio = Number(detalle.precio ?? 0);

      }

      const liquidacionServicio = queryRunner.manager.create(LiquidacionServicioOrdenServicio, {
        idLiquidacion: liquidacionOrden,
        idTarifa: detalle.idTarifa,
        costosDirectos,
        seguroVida,
        costosDirectosSeguroVida,
        aui,
        precioAntesIva,
        iva,
        precioTotal: precio
      });

      await queryRunner.manager.save(LiquidacionServicioOrdenServicio, liquidacionServicio);

      totalTarifas += +precio;

    }

    liquidacionOrden.valor_liquidacion = round2(totalTarifas);

    await queryRunner.manager.save(Liquidacione, liquidacionOrden);

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
      .leftJoinAndSelect('os.detalles', 'detalles')
      .leftJoinAndSelect('detalles.idTarifa', 't', 't.estado = 1')
      .leftJoinAndSelect(
        't.idPeriodo',
        'p',
        'p.periodoActivoFacturacion = 1 OR (CURRENT_DATE BETWEEN p.fechaInicio AND p.fechaFin)',
      )
      .leftJoinAndSelect('os.idLocacion', 'l')
      .leftJoinAndSelect('l.idCliente', 'c')
      .leftJoinAndSelect('os.idCliente', 'oc')
      .leftJoinAndSelect('t.idServicio', 's')
      .leftJoinAndSelect('s.idTipoTarifa', 'tt')
      .leftJoinAndSelect('os.idEstadoOrdenServicio', 'eos')

      .leftJoin('liquidaciones', 'liq', `
      liq.idOrdenServicio = os.idOrdenServicio AND
      liq.aniomes_liquidacion = :aniomes
    `, {
        // Debe coincidir con el formato "YYYYMM" con el que se guarda en crearLiquidacionMensualOrden
        aniomes: `${anio}${String(mes1a12).padStart(2, '0')}`,
      })
      .andWhere('liq.idLiquidacion IS NULL')
      .orderBy('os.idOrdenServicio', 'ASC')
      .addOrderBy('detalles.idOrdenServicioDetalle', 'ASC')
      .distinct(true);

    return qb.getMany();
  }

  async findByMesLiquidacionesAprobadas(anio: number, mes1a12: number) {
    if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
      throw new BadRequestException('Parámetros inválidos (anio, mes)');
    }

    const today = new Date();
    if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes1a12))
      throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    // Rango del mes objetivo: [inicioMes, finMes)
    const inicioMes = new Date(Date.UTC(anio, mes1a12 - 1, 1, 0, 0, 0));
    const finMes = new Date(Date.UTC(anio, mes1a12, 1, 0, 0, 0)); // inicio del mes siguiente

    const grupos = await this.grupoLiquidacionrepo
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
      .leftJoinAndSelect('ordenServicio.idCliente', 'clienteDirecto')
      // valor_liquidacion ya es el total CON iva; el "antes de iva" no se guarda a nivel de liquidacion,
      // solo por cada linea de servicio (lsos.precioAntesIva), asi que se suma aca para exponerlo junto al total
      // (mismo criterio que buscarGrupoLiquidaciones/findGruposPorCampoEstado, todos alimentan OrdenServicioCard)
      .leftJoin('liquidaciones.liquidacionServiciosOrdenServicio', 'lsos')
      .addSelect(['lsos.idLiquidacionServicioOrdenServicio', 'lsos.precioAntesIva'])
      .getMany();

    return grupos.map((grupo) => ({
      ...grupo,
      liquidaciones: grupo.liquidaciones.map(({ liquidacionServiciosOrdenServicio, ...liquidacion }) => ({
        ...liquidacion,
        valorLiquidacionAntesIva: round2(
          (liquidacionServiciosOrdenServicio ?? []).reduce(
            (acc, lsos) => acc + Number(lsos.precioAntesIva ?? 0),
            0,
          ),
        ),
      })),
    }));
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

      // Borrar primero el detalle (liquidacion_servicio_orden_servicio), ya que referencia a
      // liquidaciones por FK y no tiene cascade, si no la eliminacion de liquidaciones falla
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(LiquidacionServicioOrdenServicio)
        .where('idLiquidacion IN (SELECT idLiquidacion FROM liquidaciones WHERE idGrupoLiquidacion = :id)', { id: idGrupoLiquidacion })
        .execute();

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
      .leftJoinAndSelect('ordenServicio.idCliente', 'clienteDirecto')
      // valor_liquidacion ya es el total CON iva; el "antes de iva" no se guarda a nivel de liquidacion,
      // solo por cada linea de servicio (lsos.precioAntesIva), asi que se suma aca para exponerlo junto al total
      // (mismo criterio que buscarGrupoLiquidaciones, ambos alimentan OrdenServicioCard en el front)
      .leftJoin('liquidaciones.liquidacionServiciosOrdenServicio', 'lsos')
      .addSelect(['lsos.idLiquidacionServicioOrdenServicio', 'lsos.precioAntesIva'])

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

      const grupos = await query.getMany();

      return grupos.map((grupo) => ({
        ...grupo,
        liquidaciones: grupo.liquidaciones.map(({ liquidacionServiciosOrdenServicio, ...liquidacion }) => ({
          ...liquidacion,
          valorLiquidacionAntesIva: round2(
            (liquidacionServiciosOrdenServicio ?? []).reduce(
              (acc, lsos) => acc + Number(lsos.precioAntesIva ?? 0),
              0,
            ),
          ),
        })),
      }));
  }

  async buscarGrupoLiquidaciones() {
    const grupos = await this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .where(`grupo.estado = :estado`, { estado: false })
      .orderBy('grupo.idGrupoLiquidacion', 'DESC')
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      .leftJoinAndSelect('liquidaciones.ordenServicio', 'ordenServicio')
      .leftJoinAndSelect('ordenServicio.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('ordenServicio.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('ordenServicio.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('ordenServicio.idCliente', 'clienteDirecto')
      // valor_liquidacion ya es el total CON iva; el "antes de iva" no se guarda a nivel de liquidacion,
      // solo por cada linea de servicio (lsos.precioAntesIva), asi que se suma aca para exponerlo junto al total
      .leftJoin('liquidaciones.liquidacionServiciosOrdenServicio', 'lsos')
      .addSelect(['lsos.idLiquidacionServicioOrdenServicio', 'lsos.precioAntesIva'])
      .getMany();

    return grupos.map((grupo) => ({
      ...grupo,
      liquidaciones: grupo.liquidaciones.map(({ liquidacionServiciosOrdenServicio, ...liquidacion }) => ({
        ...liquidacion,
        valorLiquidacionAntesIva: round2(
          (liquidacionServiciosOrdenServicio ?? []).reduce(
            (acc, lsos) => acc + Number(lsos.precioAntesIva ?? 0),
            0,
          ),
        ),
      })),
    }));
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
      .leftJoinAndSelect('locacion.idClienteFacturacion', 'clienteFacturacion')
      .leftJoinAndSelect('orden.idCliente', 'clienteDirecto')
      .where('liq.idGrupoLiquidacion = :id', { id: grupoId })
      .orderBy('cliente.nombre', 'ASC')
      .addOrderBy('orden.idOrdenServicio', 'ASC')
      .addOrderBy('liqsos.idLiquidacionServicioOrdenServicio', 'ASC')
      .getMany();

    console.log(`Liquidaciones encontradas para el grupo ${grupoId}: ${liquidaciones.length}`);
    
    // 🔹 Agrupar por cliente y servicio
    const agrupado: Record<number, ClienteAgrupado> = {};

    // return liquidaciones;
    
    for (const liq of liquidaciones) {

      // VIGILANCIA Y ESCOLTA: cliente responsable de facturacion de la locacion (o el cliente de la locacion si no tiene uno especifico).
      // MONITOREO DE ALARMAS: el cliente asignado directamente a la orden (no tiene locacion)
      const cliente = liq.ordenServicio.idLocacion
        ? (liq.ordenServicio.idLocacion.idClienteFacturacion ?? liq.ordenServicio.idLocacion.idCliente)
        : liq.ordenServicio.idCliente;

      const clienteId = cliente.idCliente;
      const clienteNombre = cliente.nombre;
      const clienteNit = cliente.numeroIdentificacion;

      if (!agrupado[clienteId]) {

        agrupado[clienteId] = {
          id: clienteId,
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

        const servicio = liquidacionServicioOrdenServicio.idTarifa.idServicio;
        const idServicio = servicio.idServicio;

        if (!agrupado[clienteId].servicios[idServicio]) {

          agrupado[clienteId].servicios[idServicio] = {
            armado: servicio.armado,
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

        agrupado[clienteId].servicios[idServicio].cantidadOrdenes += 1;

        agrupado[clienteId].servicios[idServicio].valorLiquidarAplicacion += Number(liquidacionServicioOrdenServicio.costosDirectos);
        agrupado[clienteId].servicios[idServicio].seguroVida += Number(liquidacionServicioOrdenServicio.seguroVida);
        agrupado[clienteId].servicios[idServicio].aui += Number(liquidacionServicioOrdenServicio.aui);
        agrupado[clienteId].servicios[idServicio].tarifaAntesIva += (Number(liquidacionServicioOrdenServicio.costosDirectos) + Number(liquidacionServicioOrdenServicio.seguroVida) + Number(liquidacionServicioOrdenServicio.aui));
        agrupado[clienteId].servicios[idServicio].auiIVa += (Number(liquidacionServicioOrdenServicio.aui) * 0.19);
        agrupado[clienteId].servicios[idServicio].tarifaConIva += (Number(liquidacionServicioOrdenServicio.costosDirectos) + Number(liquidacionServicioOrdenServicio.seguroVida) + Number(liquidacionServicioOrdenServicio.aui) + (Number(liquidacionServicioOrdenServicio.aui) * 0.19));

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
  
  async obtenerServiciosDeCliente(idGrupoLiquidacion: number) {

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
      .leftJoinAndSelect('servicioLiq.idTipoHorarioDescripcion', 'tipoHorario') // 🆕 nuevo join
      .leftJoinAndSelect('orden.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('orden.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('orden.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCiudad', 'ciudad') // 🆕 nuevo join
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('locacion.idClienteFacturacion', 'clienteFacturacion')
      .leftJoinAndSelect('cliente.idSubSegmentacion', 'subsegmentacion') // 🆕 nuevo join
      .leftJoinAndSelect('orden.idCliente', 'clienteDirecto')
      .leftJoinAndSelect('clienteDirecto.idSubSegmentacion', 'clienteDirectoSubsegmentacion')
      .where('liq.idGrupoLiquidacion = :id', { id: grupoId })
      .orderBy('cliente.nombre', 'ASC')
      .addOrderBy('orden.idOrdenServicio', 'ASC')
      .addOrderBy('liqsos.idLiquidacionServicioOrdenServicio', 'ASC')
      .getMany();

    console.log(`Liquidaciones encontradas para el grupo ${grupoId}: ${liquidaciones.length}`);
    
    // 🔹 Agrupar por cliente y servicio
    const agrupado: Record<number, LiquidacionClienteAgrupado> = {};

    // return liquidaciones;
    
    for (const liq of liquidaciones) {

      // VIGILANCIA Y ESCOLTA: cliente responsable de facturacion de la locacion (o el cliente de la locacion si no tiene uno especifico).
      // MONITOREO DE ALARMAS: el cliente asignado directamente a la orden (no tiene locacion)
      const cliente = liq.ordenServicio.idLocacion
        ? (liq.ordenServicio.idLocacion.idClienteFacturacion ?? liq.ordenServicio.idLocacion.idCliente)
        : liq.ordenServicio.idCliente;

      const clienteId = cliente.idCliente;
      const clienteNombre = cliente.nombre;
      const clienteNit = cliente.numeroIdentificacion;

      if (!agrupado[clienteId]) {

        agrupado[clienteId] = {
          id: clienteId,
          cliente: clienteNombre,
          numeroId: clienteNit,
          totalLiquidarAplicacion: 0,
          totalSeguroVida: 0,
          totalAui: 0,
          totalTarifaAntesIva: 0,
          totalIvaAui: 0,
          totalTarifaConIva: 0,
          servicios: [],
        };

      }

      for (const liquidacionServicioOrdenServicio of liq.liquidacionServiciosOrdenServicio) {

        const servicio = liquidacionServicioOrdenServicio.idTarifa.idServicio;

        // VIGILANCIA Y ESCOLTA: sector/ciudad/puesto vienen de la locacion. MONITOREO DE ALARMAS: no hay locacion,
        // el sector se toma del cliente directo de la orden, y no hay ciudad/puesto (se deja el nombre del cliente como puesto)
        const sector = liq.ordenServicio.idLocacion
          ? liq.ordenServicio.idLocacion.idCliente.idSubSegmentacion?.descripcion
          : liq.ordenServicio.idCliente.idSubSegmentacion?.descripcion;

        agrupado[clienteId].servicios.push({
          ordenServicio: liq.ordenServicio.ordenServicioId.descripcionId,
          sector: sector ?? '',
          ciudad: liq.ordenServicio.idLocacion?.idCiudad.descripcion ?? '',
          puesto: liq.ordenServicio.idLocacion?.nombre ?? liq.ordenServicio.idCliente?.nombre ?? '',
          descripcionServicio: servicio.descripcion,
          tipoServicio: servicio.armado ? "Armado" : "Monitoreo",
          codigoServicioSiigo: servicio.codigo,
          horarioServicio: servicio.idTipoHorarioDescripcion.nombre,

          horasTotalesServicio: 0,
          tarifaCostosDirectos: 0,
          valorHora: 0,
          cantidadHorasPrestadas: 0,
          valorLiquidadoVidelca: 0,

          cantidadOrdenesFacturar: 1,
          valorLiquidarAplicacion: Number(liquidacionServicioOrdenServicio.costosDirectos),        
          seguroVida: Number(liquidacionServicioOrdenServicio.seguroVida),        
          aui: Number(liquidacionServicioOrdenServicio.aui),                
          tarifaAntesIva: (Number(liquidacionServicioOrdenServicio.costosDirectos) + Number(liquidacionServicioOrdenServicio.seguroVida) + Number(liquidacionServicioOrdenServicio.aui)),                
          auiIVa: (Number(liquidacionServicioOrdenServicio.aui) * 0.19),                
          tarifaConIva: (Number(liquidacionServicioOrdenServicio.costosDirectos) + Number(liquidacionServicioOrdenServicio.seguroVida) + Number(liquidacionServicioOrdenServicio.aui) + (Number(liquidacionServicioOrdenServicio.aui) * 0.19)),
        });

        agrupado[clienteId].totalLiquidarAplicacion += Number(liquidacionServicioOrdenServicio.costosDirectos);        
        agrupado[clienteId].totalSeguroVida += Number(liquidacionServicioOrdenServicio.seguroVida);        
        agrupado[clienteId].totalAui += Number(liquidacionServicioOrdenServicio.aui);                
        agrupado[clienteId].totalTarifaAntesIva += (Number(liquidacionServicioOrdenServicio.costosDirectos) + Number(liquidacionServicioOrdenServicio.seguroVida) + Number(liquidacionServicioOrdenServicio.aui));                
        agrupado[clienteId].totalIvaAui += (Number(liquidacionServicioOrdenServicio.aui) * 0.19);                
        agrupado[clienteId].totalTarifaConIva += (Number(liquidacionServicioOrdenServicio.costosDirectos) + Number(liquidacionServicioOrdenServicio.seguroVida) + Number(liquidacionServicioOrdenServicio.aui) + (Number(liquidacionServicioOrdenServicio.aui) * 0.19));

      }

    }

    const clientesAgrupados = Object.values(agrupado);

    return clientesAgrupados;
    
  }

  async downloadConsolidacionExcel(idGrupoLiquidacion: number){

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const numerosPedido = await this.numeroPedidoRepository
      .createQueryBuilder('np')
      .where('np.idGrupoLiquidacion = :idGrupoLiquidacion', { idGrupoLiquidacion })
      .orderBy('np.idNumeroPedido', 'ASC')
      .getMany();

    let numeroPedido: number;

    if (numerosPedido.length > 0){

      // Tomar el primer número (suponiendo que tiene un campo 'numero')
      numeroPedido = numerosPedido[0].idNumeroPedido;      

    } else {

      const ultimo = await this.numeroPedidoRepository.findOne({
        where: {},
        order: { 
          idNumeroPedido: 'DESC' 
        },
      });

      numeroPedido = ultimo ? ultimo.idNumeroPedido + 1 : 1;

    }

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const excelBuffer = await this.reporteConsolidacionService.generateExcel(resultado, numeroPedido);

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    if (grupoLiquidacion.consolidacion_orden != true){

      // guardamos los id

      // Crear QueryRunner para manejar la transacción
      const queryRunner = this.dataSource.createQueryRunner();
      
      await queryRunner.connect();
      await queryRunner.startTransaction();
     
      try {

        const numerosPedidoToCreate: NumeroPedido[] = [];
       
        for (const clienteData of resultado){
        
          const cliente = await this.clienteService.findOne(clienteData.id);
  
          // Crear la entidad numero pedido
          const numeroPedidoCliente = queryRunner.manager.create(NumeroPedido, {
            idGrupoLiquidacion: grupoLiquidacion,
            idCliente: cliente 
          });

          numerosPedidoToCreate.push(numeroPedidoCliente);

        }

        const savedNumerosPedido = await queryRunner.manager.save(NumeroPedido, numerosPedidoToCreate);

        // notificamos
        await this.notificarGeneracionConsolidacion(idGrupoLiquidacion, excelBuffer);

        // Confirmar la transacción
        await queryRunner.commitTransaction();

      } catch (error) {
        
        // Rollback en caso de error
        await queryRunner.rollbackTransaction();

        throw error;

      } finally {

        // Liberar el QueryRunner
        await queryRunner.release();

      }
      
    }

    // cambiar estado a TRUE
    await this.actualizarCampoGrupoEstado(idGrupoLiquidacion, {
      campo: 'consolidacion_orden',
      valor: 'true'      
    });

    return {
      excelBuffer: excelBuffer,
      title: `consolidacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}`
    };    

  }
  
  async downloadInterfaseExcel(idGrupoLiquidacion: number){

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const numerosPedido = await this.numeroPedidoRepository
      .createQueryBuilder('np')
      .where('np.idGrupoLiquidacion = :idGrupoLiquidacion', { idGrupoLiquidacion })
      .orderBy('np.idNumeroPedido', 'ASC')
      .getMany();

    // Tomar el primer número (suponiendo que tiene un campo 'numero')
    const numeroPedido = numerosPedido[0].idNumeroPedido;  

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    const fechaCreacion = grupoLiquidacion.fechaCreacion;

    const anioCreacion = fechaCreacion.getFullYear();       // Año completo (por ejemplo, 2025)
    const mesCreacion = fechaCreacion.getMonth() + 1;       // Mes (0 = enero, por eso se suma 1)
    const diaCreacion = fechaCreacion.getDate()

    const excelBuffer = await this.reporteInterfaseService.generateExcel(resultado, mes, anio, mesCreacion, diaCreacion, anioCreacion, numeroPedido);

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
      title: `exportacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}`
    };    

  }
  
  async downloadLiquidacionExcel(idGrupoLiquidacion: number){

    const resultado = await this.obtenerServiciosDeCliente(idGrupoLiquidacion);

    const excelBuffer = await this.reporteLiquidacionService.generateExcel(resultado);

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    return {
      excelBuffer: excelBuffer,
      title: `liquidacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}`
    };    

  }
  
  async downloadAnexoZip(idGrupoLiquidacion: number){

    const resultadoLiquidacion = await this.obtenerServiciosDeCliente(idGrupoLiquidacion);

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);
    
    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const numerosPedido = await this.numeroPedidoRepository
      .createQueryBuilder('np')
      .where('np.idGrupoLiquidacion = :idGrupoLiquidacion', { idGrupoLiquidacion })
      .orderBy('np.idNumeroPedido', 'ASC')
      .getMany();

    // Tomar el primer número (suponiendo que tiene un campo 'numero')
    const numeroPedido = numerosPedido[0].idNumeroPedido;  

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    const zipBuffer = await this.reporteAnexoFacturacionService.generateZip(resultado, resultadoLiquidacion, mes, anio, numeroPedido);

    // cambiar estado a TRUE
    await this.actualizarCampoGrupoEstado(idGrupoLiquidacion, {
      campo: 'generacion_anexo',
      valor: 'true'      
    })

    return {
      zipBuffer: zipBuffer,
      title: `anexos_facturacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}`
    };    

  }

  async sendConsolidacionExcel(idGrupoLiquidacion: number, enviarCorreoDto: EnviarCorreoDto){

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const numerosPedido = await this.numeroPedidoRepository
      .createQueryBuilder('np')
      .where('np.idGrupoLiquidacion = :idGrupoLiquidacion', { idGrupoLiquidacion })
      .orderBy('np.idNumeroPedido', 'ASC')
      .getMany();

    let numeroPedido: number;

    if (numerosPedido.length > 0){

      // Tomar el primer número (suponiendo que tiene un campo 'numero')
      numeroPedido = numerosPedido[0].idNumeroPedido;      

    } else {

      const ultimo = await this.numeroPedidoRepository.findOne({
        where: {},
        order: { 
          idNumeroPedido: 'DESC' 
        },
      });

      numeroPedido = ultimo ? ultimo.idNumeroPedido + 1 : 1;

    }

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const excelBuffer = await this.reporteConsolidacionService.generateExcel(resultado, numeroPedido);

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    if (grupoLiquidacion.consolidacion_orden != true){

      // guardamos los id

      // Crear QueryRunner para manejar la transacción
      const queryRunner = this.dataSource.createQueryRunner();
      
      await queryRunner.connect();
      await queryRunner.startTransaction();
     
      try {

        const numerosPedidoToCreate: NumeroPedido[] = [];
       
        for (const clienteData of resultado){
        
          const cliente = await this.clienteService.findOne(clienteData.id);
  
          // Crear la entidad numero pedido
          const numeroPedidoCliente = queryRunner.manager.create(NumeroPedido, {
            idGrupoLiquidacion: grupoLiquidacion,
            idCliente: cliente 
          });

          numerosPedidoToCreate.push(numeroPedidoCliente);

        }

        const savedNumerosPedido = await queryRunner.manager.save(NumeroPedido, numerosPedidoToCreate);
        
        // Confirmar la transacción
        await queryRunner.commitTransaction();

      } catch (error) {
        
        // Rollback en caso de error
        await queryRunner.rollbackTransaction();

        throw error;

      } finally {

        // Liberar el QueryRunner
        await queryRunner.release();

      }
      
    }

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
          filename: `consolidacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}.xlsx`,
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

    const numerosPedido = await this.numeroPedidoRepository
      .createQueryBuilder('np')
      .where('np.idGrupoLiquidacion = :idGrupoLiquidacion', { idGrupoLiquidacion })
      .orderBy('np.idNumeroPedido', 'ASC')
      .getMany();

    // Tomar el primer número (suponiendo que tiene un campo 'numero')
    const numeroPedido = numerosPedido[0].idNumeroPedido;  

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    const fechaCreacion = grupoLiquidacion.fechaCreacion;

    const anioCreacion = fechaCreacion.getFullYear();       // Año completo (por ejemplo, 2025)
    const mesCreacion = fechaCreacion.getMonth() + 1;       // Mes (0 = enero, por eso se suma 1)
    const diaCreacion = fechaCreacion.getDate()

    const excelBuffer = await this.reporteInterfaseService.generateExcel(resultado, mes, anio, mesCreacion, diaCreacion, anioCreacion, numeroPedido);

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
          filename: `exportacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}.xlsx`,
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

    const resultado = await this.obtenerServiciosDeCliente(idGrupoLiquidacion);

    const excelBuffer = await this.reporteLiquidacionService.generateExcel(resultado);

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

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
          filename: `liquidacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}.xlsx`,
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

    const resultadoLiquidacion = await this.obtenerServiciosDeCliente(idGrupoLiquidacion);

    const resultado = await this.obtenerServiciosPorCliente(idGrupoLiquidacion);

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const numerosPedido = await this.numeroPedidoRepository
      .createQueryBuilder('np')
      .where('np.idGrupoLiquidacion = :idGrupoLiquidacion', { idGrupoLiquidacion })
      .orderBy('np.idNumeroPedido', 'ASC')
      .getMany();

    // Tomar el primer número (suponiendo que tiene un campo 'numero')
    const numeroPedido = numerosPedido[0].idNumeroPedido;  

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"

    const zipBuffer = await this.reporteAnexoFacturacionService.generateZip(resultado, resultadoLiquidacion, mes, anio, numeroPedido);

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
          filename: `anexos_facturacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}.zip`,
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

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"
  
    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_CONSOLIDACION);
  
    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `consolidacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}.xlsx`,
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

    const grupoLiquidacion =  await this.grupoLiquidacionrepo.findOne({
      where: { idGrupoLiquidacion: idGrupoLiquidacion },
    });

    const fecha = grupoLiquidacion.descripcion.split("_");
    const mes = fecha[1]; // "10"
    const anio = fecha[2]; // "2025"
  
    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_INTERFASE);
  
    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `exportacion_grupo_${idGrupoLiquidacion}_mes_${mes}_anio_${anio}.xlsx`,
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
