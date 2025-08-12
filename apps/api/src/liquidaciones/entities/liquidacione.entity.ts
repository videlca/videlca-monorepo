import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { OrdenServicio } from '../../orden-servicio/entities/orden-servicio.entity';

@Entity({ name: 'liquidaciones' })
export class Liquidacione {
  @PrimaryGeneratedColumn({ name: 'idLiquidacion' })
  idLiquidacion: number;

  @Column({ name: 'valor_liquidacion', type: 'decimal', precision: 15, scale: 2, nullable: false })
  valor_liquidacion: number;

@CreateDateColumn({
  name: 'fechaCreacion',
  type: 'timestamp',
  default: () => 'CURRENT_TIMESTAMP',
  precision: 0,
})
fechaCreacion: Date;

@Column({ name: 'idOrdenServicio', type: 'int' })
idOrdenServicio: number;

@ManyToOne(() => OrdenServicio, (ordenServicio) => ordenServicio.liquidaciones, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })  
@JoinColumn({ name: 'idOrdenServicio' })
ordenServicio: OrdenServicio;
}