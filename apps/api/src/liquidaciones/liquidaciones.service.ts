import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Liquidacione } from './entities/liquidacione.entity';
import { UpdateLiquidacioneDto } from './dto/update-liquidacione.dto';
import { CreateLiquidacioneDto } from './dto/create-liquidacione.dto'
import { OrdenServicio } from 'src/orden-servicio/entities';
import { 
  toUTCDateOnly,
  endOfMonth,
  minDate,
  maxDate,
  diffDaysInclusive,
  round2,
  fmtYMD
} from 'src/common/utils/date-helpers';

@Injectable()
export class LiquidacionesService {
  constructor(
    @InjectRepository(Liquidacione)
    private readonly repo: Repository<Liquidacione>,
    @InjectRepository(OrdenServicio) private readonly ordenRepo: Repository<OrdenServicio>,
    private readonly ds: DataSource,
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
        'os.precio',

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

    const orden = await this.ordenRepo.findOne({ where: { idOrdenServicio: ordenId } });
    if (!orden) throw new NotFoundException('Orden de servicio no encontrada');

    const total = orden.precio
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
  }
}
