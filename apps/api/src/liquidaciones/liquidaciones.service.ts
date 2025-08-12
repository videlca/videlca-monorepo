// liquidaciones.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Liquidacione } from './entities/liquidacione.entity';
import { UpdateLiquidacioneDto } from './dto/update-liquidacione.dto';
import { CreateLiquidacioneDto } from './dto/create-liquidacione.dto'

@Injectable()
export class LiquidacionesService {
  constructor(
    @InjectRepository(Liquidacione)
    private readonly repo: Repository<Liquidacione>,
  ) {}

  async create(dto: CreateLiquidacioneDto) {
    // Relacionar por FK sin cargar toda la orden:
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
    .orderBy('l.idLiquidacion', 'DESC')
    .skip(skip)
    .take(take);

  if (params?.ordenId != null) {
    qb.andWhere('l.idOrdenServicio = :oid', { oid: Number(params.ordenId) });
  }

  // Si además quieres traer la orden:
  // qb.leftJoinAndSelect('l.ordenServicio', 'os').distinct(true);

  // Debug:
  // console.log(qb.getSql(), qb.getParameters());

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

  // Utilidad: listar por orden de servicio sin paginar
  async findByOrdenServicio(ordenId: number) {
    return this.repo.find({
      where: { ordenServicio: { idOrdenServicio: ordenId } },
      order: { idLiquidacion: 'DESC' },
    });
  }
}
