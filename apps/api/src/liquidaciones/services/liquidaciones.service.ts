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
import { ReporteConsolidacionService, ReporteInterfaseService, ReporteLiquidacionService, ReporteAnexoFacturacionService, ReporteGrupoLiquidacionService } from '../../reportes/services';
import { OrdenServicioService } from '../../orden-servicio/services';
import { ClientesService } from '../../clientes/services';

import { OrdenServicio } from '../../orden-servicio/entities';
import { Adicional } from '../../adicionales/entities';
import { LiquidacionServicioOrdenServicio, Liquidacione, GrupoLiquidacion, NumeroPedido } from '../entities';

import { UpdateGrupoLiquidacionEstadoDto } from '../dto/updateGrupoLiquidacionEstado.dto';
import { CrearGrupoMensualDto } from '../dto/crearGrupoMensual.dto';
import { ClienteAgrupado } from '../interfaces/consolidacion.interface';
import { LiquidacionClienteAgrupado, TipoServicioComparacion } from '../interfaces/liquidacion.interface';
import { GrupoLiquidacionPdf, OrdenLiquidadaPdf, AdicionalLiquidadoPdf, ServicioLiquidadoPdf } from '../interfaces/grupo-liquidacion-pdf.interface';

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
    @InjectRepository(Adicional)
    private readonly adicionalRepo: Repository<Adicional>,
    private ordenServicioService: OrdenServicioService,
    private readonly clienteService: ClientesService,
    private readonly reporteConsolidacionService: ReporteConsolidacionService, // Servicio para generar reportes de consolidacion
    private readonly reporteInterfaseService: ReporteInterfaseService, // Servicio para generar reportes de exportacion de interfase
    private readonly reporteLiquidacionService: ReporteLiquidacionService, // Servicio para generar reportes de liquidacion
    private readonly reporteAnexoFacturacionService: ReporteAnexoFacturacionService, // Servicio para generar reportes de anexos de facturacion
    private readonly reporteGrupoLiquidacionService: ReporteGrupoLiquidacionService, // Servicio para generar el PDF de un grupo de liquidacion
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
      .leftJoinAndSelect('l.adicional', 'adicional')
      .select([
        'l.idLiquidacion',
        'l.valor_liquidacion',
        'l.fechaCreacion',
        'l.idOrdenServicio',
        'l.idAdicional',
        'os.idOrdenServicio',
        'os.fechaInicio',
        'os.fechaFin',
        'os.precioTotal',
        'adicional.idAdicional',
        'adicional.nombre',

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
      .leftJoinAndSelect('cliente.idSubSegmentacion', 'subsegmentacion')
      // SubSegmentacion.segmentacion es "eager: true" en la entidad (ver sub-segmentacion.entity.ts), pero
      // igual que con Servicio arriba eso no aplica con createQueryBuilder: hay que unirla a mano. La columna
      // de BD se llama "idSegmentacion" pero la propiedad de la entidad es "segmentacion", no "idSegmentacion"
      .leftJoinAndSelect('subsegmentacion.segmentacion', 'segmentacion')
      .leftJoinAndSelect('cliente.idTipoCliente', 'tipoCliente')
      .leftJoinAndSelect('locacion.idCiudad', 'ciudad')
      .leftJoinAndSelect('os.idCliente', 'clienteDirecto')
      .leftJoinAndSelect('clienteDirecto.idTipoCliente', 'clienteDirectoTipoCliente')
      .leftJoinAndSelect('clienteDirecto.idSubSegmentacion', 'clienteDirectoSubsegmentacion')
      .leftJoinAndSelect('clienteDirectoSubsegmentacion.segmentacion', 'clienteDirectoSegmentacion')
      .leftJoinAndSelect('os.detalles', 'detalle')
      .leftJoinAndSelect('detalle.idTarifa', 'detalleTarifa')
      .leftJoinAndSelect('detalleTarifa.idServicio', 'detalleServicio')
      .leftJoinAndSelect('detalleServicio.idTipoServicio', 'detalleServicioTipoServicio')
      .leftJoinAndSelect('detalleServicio.idTipoDuracion', 'detalleServicioTipoDuracion')
      .leftJoinAndSelect('detalleServicio.idTipoTarifa', 'detalleServicioTipoTarifa')
      .leftJoinAndSelect('detalleServicio.idTipoHorarioDescripcion', 'detalleServicioTipoHorario')
      .leftJoinAndSelect('l.adicional', 'adicional')
      .leftJoinAndSelect('adicional.idCliente', 'adicionalCliente')
      .leftJoinAndSelect('adicionalCliente.idTipoCliente', 'adicionalClienteTipoCliente')
      .leftJoinAndSelect('adicionalCliente.idSubSegmentacion', 'adicionalClienteSubsegmentacion')
      .leftJoinAndSelect('adicionalClienteSubsegmentacion.segmentacion', 'adicionalClienteSegmentacion')
      .leftJoinAndSelect('adicional.idUsuarioCreacion', 'adicionalUsuario')
      .where('l.idLiquidacion = :id', { id: idLiquidacion })
      .getOne();

    if (!liquidacion)
      throw new NotFoundException(`Liquidacion con id "${idLiquidacion}" no se ha encontrado`);

    // ESTA LIQUIDACION ES DE UN ADICIONAL (no de una orden de servicio): no hay fechas/detalles/desglose por dia que
    // calcular como con una orden, se devuelve directo el snapshot guardado en la liquidacion
    if (liquidacion.idAdicional != null) {

      return {
        tipo: 'adicional',
        idLiquidacion: liquidacion.idLiquidacion,
        aniomes_liquidacion: liquidacion.aniomes_liquidacion,
        idAdicional: liquidacion.adicional.idAdicional,
        nombre: liquidacion.adicional.nombre,
        idCliente: liquidacion.adicional.idCliente,
        idUsuarioCreacion: liquidacion.adicional.idUsuarioCreacion,
        mesInicio: liquidacion.adicional.mesInicio,
        mesFin: liquidacion.adicional.mesFin,
        costosDirectos: liquidacion.costosDirectos,
        seguroVida: liquidacion.seguroVida,
        aui: liquidacion.aui,
        precioAntesIva: liquidacion.precioAntesIva,
        iva: liquidacion.iva,
        precioTotal: liquidacion.valor_liquidacion,
      };

    }

    const { desde, hasta } = this.rangoLiquidadoEnMes(liquidacion.ordenServicio, liquidacion.aniomes_liquidacion);

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
      tipo: 'orden',
      ...ordenServicioBase,
      fechaInicio: desde,
      fechaFin: hasta,
      precioTotal: liquidacion.valor_liquidacion,
      detalles,
      idLiquidacion: liquidacion.idLiquidacion,
      aniomes_liquidacion: liquidacion.aniomes_liquidacion,
    };

  }

  // TRAMO DE FECHAS DE UNA ORDEN QUE SE COBRA EN EL MES LIQUIDADO ("YYYYMM"). Lo usan crearLiquidacionMensualOrden
  // (para calcular el precio), la busqueda de ordenes pendientes y el detalle/PDF de lo liquidado, asi todos coinciden.
  // - La orden indefinida llega hasta fin de mes.
  // - COBRO PARCIAL MENSUAL (diaInicioCobro/diaFinCobro): solo se cobran esos dias del mes (ej: del 1 al 15); si el
  //   dia de fin no existe en el mes (ej: 31 en septiembre) se cobra hasta el ultimo dia del mes.
  // Si en el mes no hay dias que cobrar, hasta < desde (ej: la orden inicia despues del dia de fin de cobro)
  private rangoLiquidadoEnMes(ordenServicio: OrdenServicio, aniomes: string) {

    const anio = Number(aniomes.slice(0, 4));
    const mes = Number(aniomes.slice(4));

    const mesIni = new Date(Date.UTC(anio, mes - 1, 1));
    const mesFin = endOfMonth(mesIni);
    const start = toUTCDateOnly(ordenServicio.fechaInicio);
    const end = ordenServicio.fechaFin ? toUTCDateOnly(ordenServicio.fechaFin) : mesFin;

    let desde = maxDate(start, mesIni);
    let hasta = minDate(end, mesFin);

    if (ordenServicio.diaInicioCobro != null && ordenServicio.diaFinCobro != null) {

      desde = maxDate(desde, new Date(Date.UTC(anio, mes - 1, ordenServicio.diaInicioCobro)));
      // Date.UTC(anio, mes, 0) = ultimo dia del mes; un dia de fin mayor (ej: 31 en febrero) se recorta a ese
      hasta = minDate(hasta, new Date(Date.UTC(anio, mes - 1, Math.min(ordenServicio.diaFinCobro, new Date(Date.UTC(anio, mes, 0)).getUTCDate()))));

    }

    return { desde, hasta };

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

    // CADA ITEM DE ordenes/adicionales TRAE SU PROPIO MES (el del grupo o uno anterior pendiente)
    const { anio, mes, idCliente, ordenes: ordenesLiquidar = [], adicionales: adicionalesLiquidar = [] } = crearGrupoMensualDto;

    if (!anio || !mes || mes < 1 || mes > 12 || !idCliente || (!ordenesLiquidar.length && !adicionalesLiquidar.length)) {
      throw new BadRequestException('Parámetros inválidos');
    }

    const aniomesGrupo = this.formatearAniomes(anio, mes);

    // EL MES DE CADA ITEM NO PUEDE SER POSTERIOR AL MES DEL GRUPO, NI REPETIRSE (misma orden/adicional + mismo mes)
    const validarItems = (items: { id: number; anio: number; mes: number }[], etiqueta: string) => {

      const vistos = new Set<string>();

      for (const item of items) {

        const aniomesItem = this.formatearAniomes(item.anio, item.mes);

        if (aniomesItem > aniomesGrupo) {
          throw new BadRequestException(`${etiqueta} con id "${item.id}" no se puede liquidar para el mes ${this.formatearMesAnio(item.anio, item.mes)}, es posterior al mes del grupo (${this.formatearMesAnio(anio, mes)})`);
        }

        const clave = `${item.id}-${aniomesItem}`;

        if (vistos.has(clave)) {
          throw new BadRequestException(`${etiqueta} con id "${item.id}" viene repetida para el mes ${this.formatearMesAnio(item.anio, item.mes)}`);
        }

        vistos.add(clave);

      }

    };

    validarItems(ordenesLiquidar.map(o => ({ id: o.idOrdenServicio, anio: o.anio, mes: o.mes })), 'La orden');
    validarItems(adicionalesLiquidar.map(a => ({ id: a.idAdicional, anio: a.anio, mes: a.mes })), 'El adicional');

    // VALIDA QUE EL CLIENTE EXISTA (el grupo de liquidacion siempre pertenece a un cliente)
    const cliente = await this.clienteService.findOne(idCliente);

    const today = new Date();

    // if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes))
    //  throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

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
        total: 0,
        idCliente: cliente,
      });

      await queryRunner.manager.save(GrupoLiquidacion, grupoLiquidacion);
      
      // 2) crear liquidaciones del grupo de ordenes (cada una con su propio mes)
      for (const orden of ordenesLiquidar) {

        await this.crearLiquidacionMensualOrden(
          queryRunner,
          grupoLiquidacion.idGrupoLiquidacion,
          orden.idOrdenServicio,
          orden.anio,
          orden.mes
        );

      }

      // 2.1) crear liquidaciones del grupo de adicionales (cada uno con su propio mes)
      for (const adicional of adicionalesLiquidar) {

        await this.crearLiquidacionMensualAdicional(
          queryRunner,
          grupoLiquidacion.idGrupoLiquidacion,
          adicional.idAdicional,
          adicional.anio,
          adicional.mes
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

      // INDICE UNICO (orden/adicional + mes) DE liquidaciones: otro grupo liquido el mismo mes entre la validacion y
      // el guardado (ej: dos usuarios generando al mismo tiempo)
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Una o mas ordenes/adicionales ya fueron liquidados para ese mes en otro grupo, vuelva a consultar las ordenes pendientes');
      }

      throw error;

    }

    finally {

        // Liberar el QueryRunner
        await queryRunner.release();

    }

  }

  // FORMATO FIJO "YYYYMM" CON EL QUE SE GUARDA aniomes_liquidacion (mes con cero a la izquierda). Al ser de ancho
  // fijo, dos valores se pueden comparar como string para saber cual mes es anterior
  private formatearAniomes(anio: number, mes: number): string {

    return `${anio}${String(mes).padStart(2, '0')}`;

  }

  // FORMATO "MM/YYYY" PARA MENSAJES AL USUARIO
  private formatearMesAnio(anio: number, mes: number): string {

    return `${String(mes).padStart(2, '0')}/${anio}`;

  }

  // LISTA DE MESES [mes - mesesAtras, ..., mes] DEL MAS ANTIGUO AL MAS RECIENTE (cruza de año si hace falta)
  private mesesHaciaAtras(anio: number, mes: number, mesesAtras: number) {

    if (!Number.isInteger(mesesAtras) || mesesAtras < 0 || mesesAtras > 12) {
      throw new BadRequestException('El parametro mesesAtras debe ser un numero entre 0 y 12');
    }

    const meses: { anio: number; mes: number }[] = [];

    for (let i = mesesAtras; i >= 0; i--) {

      const fecha = new Date(Date.UTC(anio, mes - 1 - i, 1));

      meses.push({ anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() + 1 });

    }

    return meses;

  }

  // SI LA ORDEN/ADICIONAL YA TIENE UNA LIQUIDACION PARA ESE MES (en cualquier grupo), NO SE PUEDE VOLVER A LIQUIDAR
  private async validarNoLiquidadoEnMes(
    queryRunner: QueryRunner,
    filtro: { idOrdenServicio: number } | { idAdicional: number },
    aniomes: string,
    descripcionItem: string,
  ) {

    const liquidacionExistente = await queryRunner.manager.findOne(Liquidacione, {
      where: { ...filtro, aniomes_liquidacion: aniomes },
      relations: ['grupo'],
    });

    if (liquidacionExistente) {

      const mesAnio = this.formatearMesAnio(Number(aniomes.slice(0, 4)), Number(aniomes.slice(4)));

      throw new BadRequestException(`${descripcionItem} ya tiene una liquidacion para el mes ${mesAnio} (grupo ${liquidacionExistente.grupo?.descripcion ?? liquidacionExistente.idGrupoLiquidacion})`);

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
      .leftJoinAndSelect('os.ordenServicioId', 'osid')
      .leftJoinAndSelect('os.idEstadoOrdenServicio', 'estado')
      .leftJoinAndSelect('os.detalles', 'detalles')
      .leftJoinAndSelect('detalles.idTarifa', 'tarifa')
      .leftJoinAndSelect('tarifa.idServicio', 'servicio')
      .where('os.idOrdenServicio = :id', { id: ordenId })
      .andWhere('estado.nombre <> :estado', { estado: 'ANULADA' })
      .orderBy('detalles.idOrdenServicioDetalle', 'ASC')
      .getOne()

    if (!ordenServicioLiquidar) throw new BadRequestException('Orden no encontrada');

    const aniomes = this.formatearAniomes(anio, mes);

    await this.validarNoLiquidadoEnMes(
      queryRunner,
      { idOrdenServicio: ordenId },
      aniomes,
      `La orden ${ordenServicioLiquidar.ordenServicioId?.descripcionId ?? `con id "${ordenId}"`}`,
    );

    const esCatalogo = ordenServicioLiquidar.origenServicio === OrigenServicioEnum.CATALOGO;

    // TRAMO DEL MES A COBRAR (incluye el cobro parcial mensual diaInicioCobro/diaFinCobro si la orden lo tiene)
    const { desde, hasta } = this.rangoLiquidadoEnMes(ordenServicioLiquidar, aniomes);

    if (ordenServicioLiquidar.fechaFin !== null) {

      const total = Number(ordenServicioLiquidar.precioTotal ?? 0);

      if (!isFinite(total) || total <= 0) throw new BadRequestException('PrecioTotal inválido');

    } else {

      // ORDENES INDEFINIDAS: no aplica para "a la medida" (esas siempre requieren fecha de fin, ver validacion al crear)
      if (!esCatalogo) {
        throw new BadRequestException('No se puede liquidar una orden a la medida indefinida (sin fecha de fin)');
      }

    }

    if (hasta < desde) {

      const textoCobroParcial = ordenServicioLiquidar.diaInicioCobro != null
        ? ` (se cobra del dia ${ordenServicioLiquidar.diaInicioCobro} al ${ordenServicioLiquidar.diaFinCobro} de cada mes)`
        : '';

      throw new BadRequestException(`La orden ${ordenServicioLiquidar.ordenServicioId?.descripcionId ?? ''} no tiene días a cobrar en el mes ${this.formatearMesAnio(anio, mes)}${textoCobroParcial}`);

    }

    let totalTarifas = 0;

    const liquidacionOrden = queryRunner.manager.create(Liquidacione, {
      valor_liquidacion: 0,
      ordenServicio: ordenServicioLiquidar,
      idGrupoLiquidacion: idGrupoLiquidacion,
      // Formato fijo "YYYYMM" (mes con cero a la izquierda): sin el padStart, meses 1-9 quedaban con 5
      // caracteres (ej "20269" para septiembre/2026) y rompian cualquier lectura que asuma ancho fijo
      // (ver formatAniomes en el front, mostraba "N/A")
      aniomes_liquidacion: aniomes
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

  // CREA LA LIQUIDACION MENSUAL DE UN ADICIONAL PARA EL MES/ANIO INDICADO.
  //
  // A DIFERENCIA DE LAS ORDENES, EL ADICIONAL NO SE RECALCULA: SE TOMA TAL CUAL SU VALOR ACTUAL (costosDirectos,
  // seguroVida, aui, precioAntesIva, iva, precioTotal) Y SE COPIA ("snapshot") A LA LIQUIDACION, PARA QUE UNA EDICION
  // POSTERIOR DEL PRECIO DEL ADICIONAL NO ALTERE LIQUIDACIONES YA GENERADAS. SE COBRA EL MES COMPLETO, SIN PRORRATEAR
  private async crearLiquidacionMensualAdicional(
    queryRunner: QueryRunner,
    idGrupoLiquidacion: number,
    adicionalId: number,
    anio: number,
    mes: number
  ) {

    const adicional = await this.adicionalRepo.findOneBy({ idAdicional: adicionalId });

    if (!adicional) throw new BadRequestException('Adicional no encontrado');

    if (!adicional.estado) throw new BadRequestException(`El adicional "${adicional.nombre}" esta cancelado`);

    const aniomes = this.formatearAniomes(anio, mes);

    await this.validarNoLiquidadoEnMes(queryRunner, { idAdicional: adicionalId }, aniomes, `El adicional "${adicional.nombre}"`);

    const mesConsultado = new Date(anio, mes - 1, 1);
    const mesInicioAdicional = this.normalizarMes(adicional.mesInicio);
    const mesFinAdicional = adicional.mesFin ? this.normalizarMes(adicional.mesFin) : null;

    if (mesConsultado < mesInicioAdicional || (mesFinAdicional && mesConsultado > mesFinAdicional)) {
      throw new BadRequestException(`El adicional "${adicional.nombre}" no esta vigente en el mes solicitado`);
    }

    const liquidacionAdicional = queryRunner.manager.create(Liquidacione, {
      valor_liquidacion: Number(adicional.precioTotal),
      adicional: adicional,
      idGrupoLiquidacion: idGrupoLiquidacion,
      costosDirectos: Number(adicional.costosDirectos),
      seguroVida: Number(adicional.seguroVida),
      aui: Number(adicional.aui),
      precioAntesIva: Number(adicional.precioAntesIva),
      iva: Number(adicional.iva),
      // Formato fijo "YYYYMM" (mes con cero a la izquierda), igual que crearLiquidacionMensualOrden
      aniomes_liquidacion: aniomes
    });

    await queryRunner.manager.save(Liquidacione, liquidacionAdicional);

  }

  // NORMALIZA UNA FECHA AL DIA 1 DE SU MES (mismo criterio que AdicionalesService, se necesita aca para comparar la
  // vigencia del adicional contra el mes que se esta liquidando). SE EXTRAE EL AÑO/MES DEL STRING ISO (UTC), NO DE
  // LOS GETTERS LOCALES: con getters locales, en un servidor en UTC-5 (Colombia) una fecha guardada como el dia 1 de
  // un mes se lee como el ultimo dia del mes anterior, y el adicional deja de coincidir con el mes que se esta liquidando
  private normalizarMes(fecha: Date): Date {

    const fechaSplit = new Date(fecha).toISOString().split('T')[0];

    const [año, mes] = fechaSplit.split('-').map(Number);

    return new Date(año, mes - 1, 1);

  }

  // ORDENES PENDIENTES POR LIQUIDAR EN EL MES SOLICITADO Y EN LOS "mesesAtras" MESES ANTERIORES (ordenes de fin de mes
  // que se liquidan el mes siguiente). Cada fila es una orden + el mes que falta liquidarle: una misma orden sale una
  // vez por cada mes pendiente. Se agregan anioLiquidar/mesLiquidar/aniomesLiquidar/esMesAnterior a la orden, y se
  // ordena del mes mas antiguo al mas reciente
  async findByCreacionMes(anio: number, mes1a12: number, mesesAtras = 1) {

    if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
      throw new BadRequestException('Parámetros inválidos (anio, mes)');
    }

    const today = new Date();
    // if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes1a12))
    //   throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    const resultado: (OrdenServicio & { anioLiquidar: number; mesLiquidar: number; aniomesLiquidar: string; esMesAnterior: boolean })[] = [];

    for (const mesBuscar of this.mesesHaciaAtras(anio, mes1a12, mesesAtras)) {

      const ordenes = await this.findOrdenesPendientesDelMes(mesBuscar.anio, mesBuscar.mes);

      resultado.push(...ordenes.map(orden => ({
        ...orden,
        anioLiquidar: mesBuscar.anio,
        mesLiquidar: mesBuscar.mes,
        aniomesLiquidar: this.formatearAniomes(mesBuscar.anio, mesBuscar.mes),
        esMesAnterior: mesBuscar.anio !== anio || mesBuscar.mes !== mes1a12,
      })));

    }

    return resultado;

  }

  // ORDENES CON DIAS EN EL MES INDICADO, NO ANULADAS, QUE AUN NO TIENEN LIQUIDACION PARA ESE MES
  private async findOrdenesPendientesDelMes(anio: number, mes1a12: number) {

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
        aniomes: this.formatearAniomes(anio, mes1a12),
      })
      .andWhere('liq.idLiquidacion IS NULL')
      .orderBy('os.idOrdenServicio', 'ASC')
      .addOrderBy('detalles.idOrdenServicioDetalle', 'ASC')
      .distinct(true);

    const ordenes = await qb.getMany();

    // COBRO PARCIAL MENSUAL: una orden puede estar vigente en el mes pero no tener dias a cobrar en el (ej: cobra del
    // 1 al 15 e inicio el 20), en ese caso no se lista para liquidar ese mes
    const aniomes = this.formatearAniomes(anio, mes1a12);

    return ordenes.filter(orden => {
      const { desde, hasta } = this.rangoLiquidadoEnMes(orden, aniomes);
      return hasta >= desde;
    });
  }

  // EQUIVALENTE A findByCreacionMes PERO PARA ADICIONALES: trae, para el mes solicitado y los "mesesAtras" meses
  // anteriores, los adicionales activos y vigentes en cada mes que aun no tengan una liquidacion generada para ese mes.
  // Un mismo adicional sale una vez por cada mes pendiente, con los mismos campos agregados que findByCreacionMes
  async findAdicionalesByCreacionMes(anio: number, mes1a12: number, mesesAtras = 1) {

    if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
      throw new BadRequestException('Parámetros inválidos (anio, mes)');
    }

    const today = new Date();
    if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes1a12))
      throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    const resultado: (Adicional & { anioLiquidar: number; mesLiquidar: number; aniomesLiquidar: string; esMesAnterior: boolean })[] = [];

    for (const mesBuscar of this.mesesHaciaAtras(anio, mes1a12, mesesAtras)) {

      const adicionales = await this.findAdicionalesPendientesDelMes(mesBuscar.anio, mesBuscar.mes);

      resultado.push(...adicionales.map(adicional => ({
        ...adicional,
        anioLiquidar: mesBuscar.anio,
        mesLiquidar: mesBuscar.mes,
        aniomesLiquidar: this.formatearAniomes(mesBuscar.anio, mesBuscar.mes),
        esMesAnterior: mesBuscar.anio !== anio || mesBuscar.mes !== mes1a12,
      })));

    }

    return resultado;

  }

  // ADICIONALES ACTIVOS Y VIGENTES EN EL MES INDICADO QUE AUN NO TIENEN LIQUIDACION PARA ESE MES
  private async findAdicionalesPendientesDelMes(anio: number, mes1a12: number) {

    const mesConsultado = new Date(anio, mes1a12 - 1, 1);

    const qb = this.adicionalRepo
      .createQueryBuilder('a')
      .where('a.estado = :estado', { estado: true })
      .andWhere('a.mesInicio <= :mesConsultado AND (a.mesFin IS NULL OR a.mesFin >= :mesConsultado)', { mesConsultado })
      .leftJoinAndSelect('a.idCliente', 'cliente')
      .leftJoinAndSelect('a.idUsuarioCreacion', 'usuario')

      .leftJoin('liquidaciones', 'liq', `
      liq.idAdicional = a.idAdicional AND
      liq.aniomes_liquidacion = :aniomes
    `, {
        // Debe coincidir con el formato "YYYYMM" con el que se guarda en crearLiquidacionMensualAdicional
        aniomes: this.formatearAniomes(anio, mes1a12),
      })
      .andWhere('liq.idLiquidacion IS NULL')
      .orderBy('a.idAdicional', 'ASC')
      .distinct(true);

    return qb.getMany();
  }

  // tiposServicio: filtro opcional "monitoreo" y/o "vigilancia" (vigilancia incluye adicionales); sin el, se devuelve
  // todo (equivale a los dos). Una orden siempre es de un solo tipo de servicio (validado al crearla), asi que cada
  // liquidacion entra o sale completa del filtro; los grupos que quedan sin liquidaciones con el filtro no se devuelven
  async findByMesLiquidacionesAprobadas(anio: number, mes1a12: number, idCliente?: number, tiposServicio?: string[]) {
    if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
      throw new BadRequestException('Parámetros inválidos (anio, mes)');
    }

    const filtro = this.resolverFiltroTiposServicio(tiposServicio ?? Object.values(TipoServicioComparacion));

    const today = new Date();
    // if (today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth() + 1 < mes1a12))
    //   throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    const query = this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .where(`grupo.estado = :estado`, { estado: true })
      // EL MES/AÑO QUE SE LIQUIDA NO ES EL MES/AÑO EN QUE SE GENERO EL GRUPO (fechaCreacion): agosto se suele liquidar
      // ya entrado septiembre, asi que filtrar por fechaCreacion mostraria las liquidaciones de agosto en el historial
      // de septiembre. El mes/año real que se liquido esta codificado en "descripcion", con formato fijo
      // "liquidacion_{mes}_{anio}_{idGrupoLiquidacion}" (mes SIN cero a la izquierda, ver generarGrupoMensual), asi
      // que se extraen esos 2 segmentos con SUBSTRING_INDEX para comparar contra el mes/año solicitados
      .andWhere('SUBSTRING_INDEX(SUBSTRING_INDEX(grupo.descripcion, \'_\', 2), \'_\', -1) = :mes', { mes: mes1a12 })
      .andWhere('SUBSTRING_INDEX(SUBSTRING_INDEX(grupo.descripcion, \'_\', 3), \'_\', -1) = :anio', { anio })
      .orderBy('grupo.idGrupoLiquidacion', 'DESC')
      // CLIENTE AL QUE PERTENECE EL GRUPO: solo se necesitan id/nombre para mostrarlo en el listado
      .leftJoin('grupo.idCliente', 'grupoCliente')
      .addSelect(['grupoCliente.idCliente', 'grupoCliente.nombre'])
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      .leftJoinAndSelect('liquidaciones.ordenServicio', 'ordenServicio')
      .leftJoinAndSelect('ordenServicio.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('ordenServicio.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('ordenServicio.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('ordenServicio.idCliente', 'clienteDirecto')
      .leftJoinAndSelect('liquidaciones.adicional', 'adicional')
      .leftJoinAndSelect('adicional.idCliente', 'adicionalCliente')
      // valor_liquidacion ya es el total CON iva; el "antes de iva" no se guarda a nivel de liquidacion,
      // solo por cada linea de servicio (lsos.precioAntesIva), asi que se suma aca para exponerlo junto al total
      // (mismo criterio que buscarGrupoLiquidaciones/findGruposPorCampoEstado, todos alimentan OrdenServicioCard)
      .leftJoin('liquidaciones.liquidacionServiciosOrdenServicio', 'lsos')
      .addSelect(['lsos.idLiquidacionServicioOrdenServicio', 'lsos.precioAntesIva'])
      // TIPO DE SERVICIO DE CADA LINEA, para el filtro por tipo de servicio
      .leftJoin('lsos.idTarifa', 'lsosTarifa')
      .addSelect('lsosTarifa.idTarifa')
      .leftJoin('lsosTarifa.idServicio', 'lsosServicio')
      .addSelect('lsosServicio.idServicio')
      .leftJoin('lsosServicio.idTipoServicio', 'lsosTipoServicio')
      .addSelect(['lsosTipoServicio.idTipoServicio', 'lsosTipoServicio.nombre']);

    // FILTRO OPCIONAL POR CLIENTE DEL GRUPO (grupo.idCliente); sin idCliente se devuelven todos los grupos del mes
    if (idCliente) {
      query.andWhere('grupoCliente.idCliente = :idCliente', { idCliente });
    }

    const grupos = await query.getMany();

    return grupos
      .map((grupo) => {

        const liquidaciones = grupo.liquidaciones
          .map(({ liquidacionServiciosOrdenServicio, ...liquidacion }) => {

            // ADICIONAL, O EL TIPO DE SERVICIO DE LA ORDEN (el de cualquiera de sus lineas, todas son del mismo tipo)
            const nombreTipoServicio = liquidacionServiciosOrdenServicio?.[0]?.idTarifa?.idServicio?.idTipoServicio?.nombre;

            const tipoServicio = liquidacion.idAdicional != null
              ? 'adicional'
              : nombreTipoServicio === TipoServicioInterface.MONITOREO_ALARMAS
                ? TipoServicioComparacion.MONITOREO
                : TipoServicioComparacion.VIGILANCIA;

            return {
              ...liquidacion,
              tipoServicio,
              valorLiquidacionAntesIva: round2(
                liquidacion.idAdicional != null
                  ? Number(liquidacion.precioAntesIva ?? 0)
                  : (liquidacionServiciosOrdenServicio ?? []).reduce(
                      (acc, lsos) => acc + Number(lsos.precioAntesIva ?? 0),
                      0,
                    ),
              ),
            };

          })
          .filter(liquidacion =>
            liquidacion.tipoServicio === TipoServicioComparacion.MONITOREO
              ? filtro.monitoreo
              : filtro.vigilancia, // vigilancia y adicionales
          );

        return {
          ...grupo,
          liquidaciones,
          // TOTALES DEL GRUPO CON EL FILTRO APLICADO ("total" sigue siendo el total completo de la factura)
          totalAntesIvaFiltrado: round2(liquidaciones.reduce((acc, liquidacion) => acc + liquidacion.valorLiquidacionAntesIva, 0)),
          totalFiltrado: round2(liquidaciones.reduce((acc, liquidacion) => acc + Number(liquidacion.valor_liquidacion ?? 0), 0)),
        };

      })
      .filter(grupo => grupo.liquidaciones.length > 0);
  }

  // COMPARA LAS LIQUIDACIONES APROBADAS DE UN CLIENTE ENTRE DOS MESES (A y B). Cada grupo de liquidacion aprobado se
  // interpreta como una factura; por cada mes se cuentan grupos, ordenes y adicionales, y se suman los totales (antes
  // de iva, iva y con iva). La diferencia se calcula siempre como B - A (normalmente B es el mes mas reciente).
  // tiposServicio (al menos uno) filtra que se tiene en cuenta: monitoreo y/o vigilancia (+ adicionales)
  async compararLiquidacionesCliente(
    idCliente: number,
    anioA: number,
    mesA: number,
    anioB: number,
    mesB: number,
    tiposServicio: string[],
  ) {

    for (const [anio, mes] of [[anioA, mesA], [anioB, mesB]]) {
      if (!anio || anio < 2000 || !mes || mes < 1 || mes > 12) {
        throw new BadRequestException('Parámetros inválidos (anio, mes)');
      }
    }

    const filtro = this.resolverFiltroTiposServicio(tiposServicio);

    const cliente = await this.clienteService.findOne(idCliente);

    const periodoA = await this.resumenLiquidacionesClienteMes(idCliente, anioA, mesA, filtro);
    const periodoB = await this.resumenLiquidacionesClienteMes(idCliente, anioB, mesB, filtro);

    // DIFERENCIA B - A DE UN VALOR, CON SU PORCENTAJE SOBRE A (null si A es 0, no hay base para calcularlo)
    const diferencia = (valorA: number, valorB: number) => ({
      valor: round2(valorB - valorA),
      porcentaje: valorA === 0 ? null : round2(((valorB - valorA) / valorA) * 100),
    });

    return {
      cliente: {
        idCliente: cliente.idCliente,
        nombre: cliente.nombre,
        numeroIdentificacion: cliente.numeroIdentificacion,
      },
      tiposServicio: filtro.tipos,
      periodoA,
      periodoB,
      diferencia: {
        cantidadGrupos: diferencia(periodoA.cantidadGrupos, periodoB.cantidadGrupos),
        cantidadOrdenes: diferencia(periodoA.cantidadOrdenes, periodoB.cantidadOrdenes),
        cantidadLiquidacionesOrdenes: diferencia(periodoA.cantidadLiquidacionesOrdenes, periodoB.cantidadLiquidacionesOrdenes),
        cantidadAdicionales: diferencia(periodoA.cantidadAdicionales, periodoB.cantidadAdicionales),
        totalAntesIva: diferencia(periodoA.totalAntesIva, periodoB.totalAntesIva),
        totalIva: diferencia(periodoA.totalIva, periodoB.totalIva),
        totalConIva: diferencia(periodoA.totalConIva, periodoB.totalConIva),
      },
    };

  }

  // VALIDA EL FILTRO DE TIPOS DE SERVICIO ("monitoreo" y/o "vigilancia", al menos uno) Y LO DEVUELVE COMO BANDERAS.
  // "vigilancia" incluye tambien los adicionales
  private resolverFiltroTiposServicio(tiposServicio: string[]) {

    const tiposValidos = Object.values(TipoServicioComparacion) as string[];
    const tipos = [...new Set(tiposServicio.map(tipo => tipo.trim().toLowerCase()).filter(Boolean))];

    if (!tipos.length || tipos.some(tipo => !tiposValidos.includes(tipo))) {
      throw new BadRequestException(`Debe seleccionar al menos un tipo de servicio valido en tiposServicio (${tiposValidos.join(', ')})`);
    }

    return {
      tipos: tiposValidos.filter(tipo => tipos.includes(tipo)),
      monitoreo: tipos.includes(TipoServicioComparacion.MONITOREO),
      vigilancia: tipos.includes(TipoServicioComparacion.VIGILANCIA),
    };

  }

  // RESUMEN DE LOS GRUPOS DE LIQUIDACION APROBADOS DE UN CLIENTE EN UN MES. El mes es el MES DEL GRUPO (el que va en
  // "descripcion", mismo criterio que findByMesLiquidacionesAprobadas), no el aniomes de cada liquidacion: un grupo de
  // septiembre que incluye un mes anterior pendiente de agosto se factura en septiembre.
  //
  // FILTRO POR TIPO DE SERVICIO: la orden no guarda su tipo, asi que se clasifica cada linea liquidada (lsos) por el tipo
  // del servicio de su tarifa, y solo se suman las lineas de los tipos seleccionados. Una orden cuenta si tiene al menos
  // una linea del tipo seleccionado; los adicionales cuentan solo con "vigilancia"; un grupo cuenta si aporta algo con
  // el filtro aplicado (sus totales son solo lo filtrado)
  private async resumenLiquidacionesClienteMes(
    idCliente: number,
    anio: number,
    mes1a12: number,
    filtro: { monitoreo: boolean; vigilancia: boolean },
  ) {

    const grupos = await this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .where('grupo.estado = :estado', { estado: true })
      .andWhere('grupo.idCliente = :idCliente', { idCliente })
      .andWhere('SUBSTRING_INDEX(SUBSTRING_INDEX(grupo.descripcion, \'_\', 2), \'_\', -1) = :mes', { mes: mes1a12 })
      .andWhere('SUBSTRING_INDEX(SUBSTRING_INDEX(grupo.descripcion, \'_\', 3), \'_\', -1) = :anio', { anio })
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      // Los totales de una liquidacion de orden se toman de sus lineas de servicio (lsos), para poder filtrar por el
      // tipo de servicio de cada linea; el de un adicional, del snapshot guardado en la propia liquidacion
      .leftJoin('liquidaciones.liquidacionServiciosOrdenServicio', 'lsos')
      .addSelect(['lsos.idLiquidacionServicioOrdenServicio', 'lsos.precioAntesIva', 'lsos.precioTotal'])
      .leftJoin('lsos.idTarifa', 'tarifa')
      .addSelect('tarifa.idTarifa')
      .leftJoin('tarifa.idServicio', 'servicio')
      .addSelect('servicio.idServicio')
      .leftJoin('servicio.idTipoServicio', 'tipoServicio')
      .addSelect(['tipoServicio.idTipoServicio', 'tipoServicio.nombre'])
      .orderBy('grupo.idGrupoLiquidacion', 'ASC')
      .getMany();

    const lineaIncluida = (nombreTipoServicio: string | undefined) =>
      (filtro.monitoreo && nombreTipoServicio === TipoServicioInterface.MONITOREO_ALARMAS) ||
      (filtro.vigilancia && nombreTipoServicio === TipoServicioInterface.VIGILANCIA_Y_ESCOLTA);

    const ordenesMes = new Set<number>();
    const adicionalesMes = new Set<number>();
    let cantidadLiquidacionesOrdenes = 0;

    const resumenGrupos = grupos.map(grupo => {

      const ordenesGrupo = new Set<number>();
      const adicionalesGrupo = new Set<number>();
      let totalAntesIva = 0;
      let totalConIva = 0;

      for (const liquidacion of grupo.liquidaciones ?? []) {

        if (liquidacion.idAdicional != null) {

          if (!filtro.vigilancia) continue;

          adicionalesGrupo.add(liquidacion.idAdicional);
          adicionalesMes.add(liquidacion.idAdicional);
          totalAntesIva += Number(liquidacion.precioAntesIva ?? 0);
          totalConIva += Number(liquidacion.valor_liquidacion ?? 0);

        } else if (liquidacion.idOrdenServicio != null) {

          const lineas = (liquidacion.liquidacionServiciosOrdenServicio ?? [])
            .filter(lsos => lineaIncluida(lsos.idTarifa?.idServicio?.idTipoServicio?.nombre));

          if (!lineas.length) continue;

          ordenesGrupo.add(liquidacion.idOrdenServicio);
          ordenesMes.add(liquidacion.idOrdenServicio);
          cantidadLiquidacionesOrdenes++;
          totalAntesIva += lineas.reduce((acc, lsos) => acc + Number(lsos.precioAntesIva ?? 0), 0);
          totalConIva += lineas.reduce((acc, lsos) => acc + Number(lsos.precioTotal ?? 0), 0);

        }

      }

      return {
        idGrupoLiquidacion: grupo.idGrupoLiquidacion,
        descripcion: grupo.descripcion,
        fechaCreacion: grupo.fechaCreacion,
        cantidadOrdenes: ordenesGrupo.size,
        cantidadAdicionales: adicionalesGrupo.size,
        totalAntesIva: round2(totalAntesIva),
        totalIva: round2(totalConIva - totalAntesIva),
        totalConIva: round2(totalConIva),
      };

    })
      // GRUPOS QUE NO APORTAN NADA CON EL FILTRO DE TIPO DE SERVICIO (ej: grupo solo de monitoreo filtrando vigilancia)
      .filter(grupo => grupo.cantidadOrdenes > 0 || grupo.cantidadAdicionales > 0);

    const totalAntesIva = round2(resumenGrupos.reduce((acc, grupo) => acc + grupo.totalAntesIva, 0));
    const totalConIva = round2(resumenGrupos.reduce((acc, grupo) => acc + grupo.totalConIva, 0));

    return {
      anio,
      mes: mes1a12,
      aniomes: this.formatearAniomes(anio, mes1a12),
      cantidadGrupos: resumenGrupos.length,
      // ORDENES DISTINTAS (una orden liquidada por dos meses en el mismo mes de facturacion cuenta una vez)
      cantidadOrdenes: ordenesMes.size,
      // LIQUIDACIONES DE ORDENES (una orden liquidada por dos meses cuenta dos veces)
      cantidadLiquidacionesOrdenes,
      cantidadAdicionales: adicionalesMes.size,
      totalAntesIva,
      totalIva: round2(totalConIva - totalAntesIva),
      totalConIva,
      grupos: resumenGrupos,
    };

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

  // anio/mes: filtro opcional por el MES DEL GRUPO (mismo criterio que el historial de liquidaciones aprobadas);
  // se envian los dos o ninguno. Sin ellos se devuelven los grupos de todos los meses
  async findGruposPorCampoEstado(
    campo: 'consolidacion_orden' | 'generacion_interfase' | 'generacion_anexo',
    valor: string,
    anio?: number,
    mes?: number,
  ) {

    if ((anio == null) !== (mes == null)) {
      throw new BadRequestException('Para filtrar por mes se deben enviar anio y mes juntos');
    }

    const query = this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .orderBy('grupo.idGrupoLiquidacion', 'DESC')
      // CLIENTE AL QUE PERTENECE EL GRUPO: solo se necesitan id/nombre para mostrarlo en el listado
      .leftJoin('grupo.idCliente', 'grupoCliente')
      .addSelect(['grupoCliente.idCliente', 'grupoCliente.nombre'])
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      .leftJoinAndSelect('liquidaciones.ordenServicio', 'ordenServicio')
      .leftJoinAndSelect('ordenServicio.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('ordenServicio.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('ordenServicio.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('ordenServicio.idCliente', 'clienteDirecto')
      .leftJoinAndSelect('liquidaciones.adicional', 'adicional')
      .leftJoinAndSelect('adicional.idCliente', 'adicionalCliente')
      // valor_liquidacion ya es el total CON iva; el "antes de iva" no se guarda a nivel de liquidacion,
      // solo por cada linea de servicio (lsos.precioAntesIva), asi que se suma aca para exponerlo junto al total
      // (mismo criterio que buscarGrupoLiquidaciones, ambos alimentan OrdenServicioCard en el front)
      .leftJoin('liquidaciones.liquidacionServiciosOrdenServicio', 'lsos')
      .addSelect(['lsos.idLiquidacionServicioOrdenServicio', 'lsos.precioAntesIva'])

      if (campo === 'consolidacion_orden') {
        // Prerrequisito: el grupo debe estar aprobado (estado=true) antes de poder consolidarse. Sin este
        // filtro, un grupo recien creado (estado=false, consolidacion_orden=false por defecto) ya cumplia
        // consolidacion_orden=false y aparecia aca sin haber pasado por la aprobacion
        query.where('grupo.estado = :aprobado', { aprobado: true })
             .andWhere('grupo.consolidacion_orden = :valor', { valor: valor === 'true' });
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

      // FILTRO POR MES DEL GRUPO: va despues de los filtros por campo porque esos usan where() (que reemplaza
      // cualquier condicion anterior). El mes/año estan en "descripcion" ("liquidacion_{mes}_{anio}_{id}", mes sin
      // cero a la izquierda), igual que en findByMesLiquidacionesAprobadas
      if (anio != null && mes != null) {
        query
          .andWhere('SUBSTRING_INDEX(SUBSTRING_INDEX(grupo.descripcion, \'_\', 2), \'_\', -1) = :mes', { mes })
          .andWhere('SUBSTRING_INDEX(SUBSTRING_INDEX(grupo.descripcion, \'_\', 3), \'_\', -1) = :anio', { anio });
      }

      const grupos = await query.getMany();

      return grupos.map((grupo) => ({
        ...grupo,
        liquidaciones: grupo.liquidaciones.map(({ liquidacionServiciosOrdenServicio, ...liquidacion }) => ({
          ...liquidacion,
          valorLiquidacionAntesIva: round2(
            liquidacion.idAdicional != null
              ? Number(liquidacion.precioAntesIva ?? 0)
              : (liquidacionServiciosOrdenServicio ?? []).reduce(
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
      // CLIENTE AL QUE PERTENECE EL GRUPO: solo se necesitan id/nombre para mostrarlo en el listado
      .leftJoin('grupo.idCliente', 'grupoCliente')
      .addSelect(['grupoCliente.idCliente', 'grupoCliente.nombre'])
      .leftJoinAndSelect('grupo.liquidaciones', 'liquidaciones')
      .leftJoinAndSelect('liquidaciones.ordenServicio', 'ordenServicio')
      .leftJoinAndSelect('ordenServicio.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('ordenServicio.idEstadoOrdenServicio', 'estadoOrdenServicio')
      .leftJoinAndSelect('ordenServicio.idLocacion', 'locacion')
      .leftJoinAndSelect('locacion.idCliente', 'cliente')
      .leftJoinAndSelect('ordenServicio.idCliente', 'clienteDirecto')
      .leftJoinAndSelect('liquidaciones.adicional', 'adicional')
      .leftJoinAndSelect('adicional.idCliente', 'adicionalCliente')
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
          liquidacion.idAdicional != null
            ? Number(liquidacion.precioAntesIva ?? 0)
            : (liquidacionServiciosOrdenServicio ?? []).reduce(
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
      .leftJoinAndSelect('liq.adicional', 'adicional')
      .leftJoinAndSelect('adicional.idCliente', 'adicionalCliente')
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

      const esAdicional = liq.idAdicional != null;

      // ORDEN DE VIGILANCIA Y ESCOLTA: cliente responsable de facturacion de la locacion (o el cliente de la locacion si
      // no tiene uno especifico). ORDEN DE MONITOREO DE ALARMAS: el cliente asignado directamente a la orden (no tiene
      // locacion). ADICIONAL: el cliente al que se le asigno el adicional
      const cliente = esAdicional
        ? liq.adicional.idCliente
        : (liq.ordenServicio.idLocacion
          ? (liq.ordenServicio.idLocacion.idClienteFacturacion ?? liq.ordenServicio.idLocacion.idCliente)
          : liq.ordenServicio.idCliente);

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

      if (esAdicional) {

        // CLAVE NEGATIVA PARA NO COLISIONAR CON idServicio DEL CATALOGO (siempre positivo)
        const idAdicionalKey = -liq.adicional.idAdicional;

        if (!agrupado[clienteId].servicios[idAdicionalKey]) {

          agrupado[clienteId].servicios[idAdicionalKey] = {
            esMonitoreo: false,
            esAdicional: true,
            servicioAplicacion: liq.adicional.nombre,
            codigoServicioSiigo: '',
            valorLiquidarAplicacion: 0,
            seguroVida: 0,
            aui: 0,
            tarifaAntesIva: 0,
            auiIVa: 0,
            tarifaConIva: 0,
            cantidadOrdenes: 0
          };

        }

        const costosDirectos = Number(liq.costosDirectos ?? 0);
        const seguroVida = Number(liq.seguroVida ?? 0);
        const aui = Number(liq.aui ?? 0);

        agrupado[clienteId].servicios[idAdicionalKey].cantidadOrdenes += 1;
        agrupado[clienteId].servicios[idAdicionalKey].valorLiquidarAplicacion += costosDirectos;
        agrupado[clienteId].servicios[idAdicionalKey].seguroVida += seguroVida;
        agrupado[clienteId].servicios[idAdicionalKey].aui += aui;
        agrupado[clienteId].servicios[idAdicionalKey].tarifaAntesIva += (costosDirectos + seguroVida + aui);
        agrupado[clienteId].servicios[idAdicionalKey].auiIVa += (aui * 0.19);
        agrupado[clienteId].servicios[idAdicionalKey].tarifaConIva += (costosDirectos + seguroVida + aui + (aui * 0.19));

      } else {

        for (const liquidacionServicioOrdenServicio of liq.liquidacionServiciosOrdenServicio) {

          const servicio = liquidacionServicioOrdenServicio.idTarifa.idServicio;
          const idServicio = servicio.idServicio;

          if (!agrupado[clienteId].servicios[idServicio]) {

            agrupado[clienteId].servicios[idServicio] = {
              esMonitoreo: servicio.idTipoServicio?.nombre === TipoServicioInterface.MONITOREO_ALARMAS,
              esAdicional: false,
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
      .leftJoinAndSelect('liq.adicional', 'adicional')
      .leftJoinAndSelect('adicional.idCliente', 'adicionalCliente')
      .leftJoinAndSelect('adicionalCliente.idSubSegmentacion', 'adicionalClienteSubsegmentacion')
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

      const esAdicional = liq.idAdicional != null;

      // ORDEN DE VIGILANCIA Y ESCOLTA: cliente responsable de facturacion de la locacion (o el cliente de la locacion si
      // no tiene uno especifico). ORDEN DE MONITOREO DE ALARMAS: el cliente asignado directamente a la orden (no tiene
      // locacion). ADICIONAL: el cliente al que se le asigno el adicional
      const cliente = esAdicional
        ? liq.adicional.idCliente
        : (liq.ordenServicio.idLocacion
          ? (liq.ordenServicio.idLocacion.idClienteFacturacion ?? liq.ordenServicio.idLocacion.idCliente)
          : liq.ordenServicio.idCliente);

      const clienteId = cliente.idCliente;
      const clienteNombre = cliente.nombre;
      const clienteNit = cliente.numeroIdentificacion;

      const mesLiquidado = this.formatearMesAnio(Number(liq.aniomes_liquidacion.slice(0, 4)), Number(liq.aniomes_liquidacion.slice(4)));

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

      if (esAdicional) {

        // UN ADICIONAL NO TIENE ORDEN/CIUDAD/PUESTO/CODIGO SIIGO/TIPO DE SERVICIO/HORARIO (esos campos quedan vacios),
        // solo su nombre (como descripcion) y el sector del cliente al que se le cobra
        const costosDirectos = Number(liq.costosDirectos ?? 0);
        const seguroVida = Number(liq.seguroVida ?? 0);
        const aui = Number(liq.aui ?? 0);

        agrupado[clienteId].servicios.push({
          ordenServicio: '',
          sector: liq.adicional.idCliente.idSubSegmentacion?.descripcion ?? '',
          ciudad: '',
          puesto: '',
          descripcionServicio: liq.adicional.nombre,
          tipoServicio: '',
          codigoServicioSiigo: '',
          horarioServicio: '',

          horasTotalesServicio: 0,
          tarifaCostosDirectos: 0,
          valorHora: 0,
          cantidadHorasPrestadas: 0,
          valorLiquidadoVidelca: 0,

          cantidadOrdenesFacturar: 1,
          valorLiquidarAplicacion: costosDirectos,
          seguroVida,
          aui,
          tarifaAntesIva: (costosDirectos + seguroVida + aui),
          auiIVa: (aui * 0.19),
          tarifaConIva: (costosDirectos + seguroVida + aui + (aui * 0.19)),
          mesLiquidado,
        });

        agrupado[clienteId].totalLiquidarAplicacion += costosDirectos;
        agrupado[clienteId].totalSeguroVida += seguroVida;
        agrupado[clienteId].totalAui += aui;
        agrupado[clienteId].totalTarifaAntesIva += (costosDirectos + seguroVida + aui);
        agrupado[clienteId].totalIvaAui += (aui * 0.19);
        agrupado[clienteId].totalTarifaConIva += (costosDirectos + seguroVida + aui + (aui * 0.19));

        continue;

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
          // SEGUN EL TIPO DE SERVICIO (no el campo armado): monitoreo de alarmas -> "Monitoreo", vigilancia -> "Armado"
          tipoServicio: servicio.idTipoServicio?.nombre === TipoServicioInterface.MONITOREO_ALARMAS ? "Monitoreo" : "Armado",
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
          mesLiquidado,
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
  
  // ARMA LOS DATOS DEL PDF DE UN GRUPO DE LIQUIDACION (la "factura" del cliente del grupo). Los precios salen tal cual
  // de lo ya liquidado (liquidacion_servicio_orden_servicio para ordenes, el snapshot de la liquidacion para
  // adicionales), no se recalcula nada
  private async obtenerDatosPdfGrupo(idGrupoLiquidacion: number): Promise<GrupoLiquidacionPdf> {

    const grupo = await this.grupoLiquidacionrepo
      .createQueryBuilder('grupo')
      .leftJoinAndSelect('grupo.idCliente', 'grupoCliente')
      .leftJoinAndSelect('grupo.liquidaciones', 'liq')
      .leftJoinAndSelect('liq.ordenServicio', 'orden')
      .leftJoinAndSelect('orden.ordenServicioId', 'ordenServicioId')
      .leftJoinAndSelect('orden.detalles', 'detalle')
      .leftJoinAndSelect('detalle.idTarifa', 'detalleTarifa')
      .leftJoinAndSelect('liq.liquidacionServiciosOrdenServicio', 'lsos')
      .leftJoinAndSelect('lsos.idTarifa', 'lsosTarifa')
      .leftJoinAndSelect('lsosTarifa.idServicio', 'lsosServicio')
      .leftJoinAndSelect('lsosServicio.idTipoServicio', 'lsosTipoServicio')
      .leftJoinAndSelect('lsosServicio.idTipoTarifa', 'lsosTipoTarifa')
      .leftJoinAndSelect('liq.adicional', 'adicional')
      .where('grupo.idGrupoLiquidacion = :idGrupoLiquidacion', { idGrupoLiquidacion })
      .orderBy('liq.idLiquidacion', 'ASC')
      .addOrderBy('detalle.idOrdenServicioDetalle', 'ASC')
      .addOrderBy('lsos.idLiquidacionServicioOrdenServicio', 'ASC')
      .getOne();

    if (!grupo) throw new NotFoundException('Grupo de liquidación no encontrado');

    if (!grupo.idCliente) {
      throw new BadRequestException(`El grupo de liquidacion ${idGrupoLiquidacion} no tiene un cliente asignado, no se puede generar su PDF`);
    }

    // CLIENTE COMPLETO (con sus relaciones eager: tipo de identificacion, tipo de cliente, segmentacion)
    const cliente = await this.clienteService.findOne(grupo.idCliente.idCliente);

    // "liquidacion_{mes}_{anio}_{id}", ver generarGrupoMensual
    const [, mesGrupo, anioGrupo] = grupo.descripcion.split('_');

    const mesLiquidado = (aniomes: string) => this.formatearMesAnio(Number(aniomes.slice(0, 4)), Number(aniomes.slice(4)));

    const precioDe = (valores: { costosDirectos: any; seguroVida: any; aui: any; precioAntesIva: any; iva: any }, precio: any) => ({
      costosDirectos: round2(Number(valores.costosDirectos ?? 0)),
      seguroVida: round2(Number(valores.seguroVida ?? 0)),
      aui: round2(Number(valores.aui ?? 0)),
      precioAntesIva: round2(Number(valores.precioAntesIva ?? 0)),
      iva: round2(Number(valores.iva ?? 0)),
      precio: round2(Number(precio ?? 0)),
    });

    const ordenes: OrdenLiquidadaPdf[] = [];
    const adicionales: AdicionalLiquidadoPdf[] = [];

    // ORDENES AGRUPADAS POR ORDEN Y, DENTRO DE CADA UNA, POR MES LIQUIDADO (una orden puede venir por varios meses)
    const liquidacionesOrdenes = grupo.liquidaciones
      .filter(liq => liq.ordenServicio)
      .sort((a, b) => a.ordenServicio.idOrdenServicio - b.ordenServicio.idOrdenServicio || a.aniomes_liquidacion.localeCompare(b.aniomes_liquidacion));

    for (const liq of liquidacionesOrdenes) {

      const orden = liq.ordenServicio;
      const lineas = liq.liquidacionServiciosOrdenServicio ?? [];
      const { desde, hasta } = this.rangoLiquidadoEnMes(orden, liq.aniomes_liquidacion);

      let servicios: ServicioLiquidadoPdf[];

      if (orden.origenServicio === OrigenServicioEnum.CATALOGO) {

        // CATALOGO: una linea liquidada por cada servicio de la orden. El horario no se guarda en la linea liquidada,
        // se toma del detalle de la orden emparejando POR POSICION dentro de cada idTarifa (una orden puede tener
        // varias unidades del mismo servicio, ambas listas vienen ordenadas por id = orden de creacion)
        const detallesPorTarifa = new Map<number, typeof orden.detalles>();

        for (const detalle of orden.detalles ?? []) {
          const idTarifa = detalle.idTarifa?.idTarifa;
          detallesPorTarifa.set(idTarifa, [...(detallesPorTarifa.get(idTarifa) ?? []), detalle]);
        }

        const posicionPorTarifa = new Map<number, number>();

        servicios = lineas.map(lsos => {

          const servicio = lsos.idTarifa.idServicio;
          const idTarifa = lsos.idTarifa.idTarifa;
          const posicion = posicionPorTarifa.get(idTarifa) ?? 0;
          posicionPorTarifa.set(idTarifa, posicion + 1);

          const detalle = detallesPorTarifa.get(idTarifa)?.[posicion];

          return {
            descripcion: servicio.descripcion,
            codigo: servicio.codigo,
            horario: detalle ? `${detalle.horaInicio} - ${detalle.horaFin}` : null,
            tipoTarifa: servicio.idTipoTarifa?.nombre ?? null,
            ...precioDe(lsos, lsos.precioTotal),
          };

        });

      } else {

        // A LA MEDIDA: una linea liquidada por cada dia del mes; se muestra como un solo servicio con la suma de sus dias
        const suma = (campo: 'costosDirectos' | 'seguroVida' | 'aui' | 'precioAntesIva' | 'iva' | 'precioTotal') =>
          lineas.reduce((acc, lsos) => acc + Number(lsos[campo] ?? 0), 0);

        servicios = [{
          descripcion: `Servicio a la medida (${lineas.length} día(s))`,
          codigo: null,
          horario: null,
          tipoTarifa: null,
          ...precioDe({
            costosDirectos: suma('costosDirectos'),
            seguroVida: suma('seguroVida'),
            aui: suma('aui'),
            precioAntesIva: suma('precioAntesIva'),
            iva: suma('iva'),
          }, suma('precioTotal')),
        }];

      }

      ordenes.push({
        codigo: orden.ordenServicioId?.descripcionId ?? `#${orden.idOrdenServicio}`,
        tipoServicio: lineas[0]?.idTarifa?.idServicio?.idTipoServicio?.nombre ?? '-',
        mesLiquidado: mesLiquidado(liq.aniomes_liquidacion),
        desde,
        hasta,
        servicios,
        total: round2(Number(liq.valor_liquidacion ?? 0)),
      });

    }

    for (const liq of grupo.liquidaciones.filter(liq => liq.adicional)) {

      adicionales.push({
        nombre: liq.adicional.nombre,
        mesLiquidado: mesLiquidado(liq.aniomes_liquidacion),
        ...precioDe(liq, liq.valor_liquidacion),
      });

    }

    // TOTALES DEL GRUPO: suma de todos los servicios de las ordenes y de los adicionales
    const lineasPrecio = [...ordenes.flatMap(orden => orden.servicios), ...adicionales];
    const sumaTotal = (campo: 'costosDirectos' | 'seguroVida' | 'aui' | 'precioAntesIva' | 'iva' | 'precio') =>
      round2(lineasPrecio.reduce((acc, linea) => acc + linea[campo], 0));

    return {
      idGrupoLiquidacion: grupo.idGrupoLiquidacion,
      descripcion: grupo.descripcion,
      anio: Number(anioGrupo),
      mes: Number(mesGrupo),
      fechaCreacion: grupo.fechaCreacion,
      aprobado: grupo.estado,
      cliente,
      ordenes,
      adicionales,
      totales: {
        costosDirectos: sumaTotal('costosDirectos'),
        seguroVida: sumaTotal('seguroVida'),
        aui: sumaTotal('aui'),
        precioAntesIva: sumaTotal('precioAntesIva'),
        iva: sumaTotal('iva'),
        precio: sumaTotal('precio'),
      },
    };

  }

  async downloadGrupoLiquidacionPdf(idGrupoLiquidacion: number) {

    const datos = await this.obtenerDatosPdfGrupo(idGrupoLiquidacion);

    return {
      pdfDoc: this.reporteGrupoLiquidacionService.getReporteGrupoLiquidacion(datos),
      title: `liquidacion_grupo_${idGrupoLiquidacion}_mes_${datos.mes}_anio_${datos.anio}`,
    };

  }

  async sendGrupoLiquidacionPdf(idGrupoLiquidacion: number, enviarCorreoDto: EnviarCorreoDto) {

    const datos = await this.obtenerDatosPdfGrupo(idGrupoLiquidacion);

    const pdfBuffer = await this.reporteGrupoLiquidacionService.getBufferReporteGrupoLiquidacion(datos);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): PDF de liquidacion ${datos.descripcion} - ${datos.cliente.nombre}`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">LIQUIDACION ${datos.descripcion}</h2>
          </div>

          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia PDF adjunto con la liquidacion <b>${datos.descripcion}</b> del cliente <b>${datos.cliente.nombre}</b>
              correspondiente al mes <b>${this.formatearMesAnio(datos.anio, datos.mes)}</b>. <br><br>
              Por favor, revise el <b>PDF adjunto</b> para más detalles.
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
          filename: `liquidacion_grupo_${idGrupoLiquidacion}_mes_${datos.mes}_anio_${datos.anio}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo con el PDF del grupo de liquidacion ${idGrupoLiquidacion} a los emails ${emails}, revisar correos si estan bien escritos`);
    }

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
