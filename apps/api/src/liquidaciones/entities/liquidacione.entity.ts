import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { OrdenServicio } from '../../orden-servicio/entities/orden-servicio.entity';
import { GrupoLiquidacion } from './grupo_liquidaciones.entity';

@Entity({ name: 'liquidaciones' })
export class Liquidacione {
  @PrimaryGeneratedColumn({ name: 'idLiquidacion' })
  idLiquidacion: number;

  @Column({
    name: 'valor_liquidacion',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  valor_liquidacion: number;

  @CreateDateColumn({
    name: 'fechaCreacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 0,
  })
  fechaCreacion: Date;

  // relación con orden_servicio
  @Column({ name: 'idOrdenServicio', type: 'int' })
  idOrdenServicio: number;

  @ManyToOne(
    () => OrdenServicio,
    (ordenServicio) => ordenServicio.liquidaciones,
    { onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
  )
  @JoinColumn({ name: 'idOrdenServicio' })
  ordenServicio: OrdenServicio;

  // relación con grupo_liquidaciones
  @Column({ name: 'idGrupoLiquidacion', type: 'int' })
  idGrupoLiquidacion: number;

  @Column({ type: 'boolean', default: false })
  estado: boolean;

  @ManyToOne(
    () => GrupoLiquidacion,
    (grupo) => grupo.liquidaciones,
    { onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
  )
  @JoinColumn({ name: 'idGrupoLiquidacion' })
  grupo: GrupoLiquidacion;

    @Column({
    name: 'aniomes_liquidacion',
    type: 'varchar',
    nullable: false
  })
  aniomes_liquidacion: string;
}