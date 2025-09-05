import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Liquidacione } from '../entities/liquidacione.entity';
import { UpdateLiquidacioneDto } from '../dto/update-liquidacione.dto';
import { CreateLiquidacioneDto } from '../dto/create-liquidacione.dto'
import { OrdenServicio } from '../../orden-servicio/entities';
import { OrdenServicioService } from '../../orden-servicio/services/orden-servicio.service';
import {
  toUTCDateOnly,
  endOfMonth,
  minDate,
  maxDate,
  diffDaysInclusive,
  round2,
  fmtYMD
} from '../../common/utils/date-helpers';
import { PrecioOrdenDto } from '../../orden-servicio/dto';
import { EstadoOrdenServicio } from '../../common/interfaces/estado-orden-servicio.interface';

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

  async crearLiquidacionParaMes(ordenId: number, anio: number, mes1a12: number) {
    if (!anio || !mes1a12 || mes1a12 < 1 || mes1a12 > 12) {
      throw new BadRequestException('Parámetros de fecha inválidos (anio, mes)');
    }

    const today = new Date();
    if(today.getFullYear() < anio || (today.getFullYear() >= anio && today.getMonth()+1 < mes1a12)) 
      throw new BadRequestException('No se puede liquidar una fecha mayor al actual');

    if(today.getMonth()+1 === mes1a12 && today.getDay() < 20)
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
