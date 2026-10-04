import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany, Index } from 'typeorm';
import { OrdenServicio } from '../../orden-servicio/entities/orden-servicio.entity';
import { Adicional } from '../../adicionales/entities/adicional.entity';
import { GrupoLiquidacion } from './grupo_liquidaciones.entity';
import { LiquidacionServicioOrdenServicio } from './liquidacion_servicio_orden_servicio.entity';

// UNA ORDEN (o un adicional) SOLO SE PUEDE LIQUIDAR UNA VEZ POR MES, sin importar en que grupo. Es la garantia final
// contra liquidaciones dobles (ej: dos grupos generados al mismo tiempo); el servicio valida antes para dar un mensaje
// claro. MySQL permite varios NULL en un indice unico, asi que las filas de adicionales (idOrdenServicio NULL) no
// chocan entre si en el primer indice, ni las de ordenes (idAdicional NULL) en el segundo
@Index('UQ_liquidaciones_orden_mes', ['idOrdenServicio', 'aniomes_liquidacion'], { unique: true })
@Index('UQ_liquidaciones_adicional_mes', ['idAdicional', 'aniomes_liquidacion'], { unique: true })
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

  // relación con orden_servicio -> SOLO APLICA SI ESTA LIQUIDACION ES DE UNA ORDEN DE SERVICIO (no de un adicional, ver idAdicional)
  @Column({ name: 'idOrdenServicio', type: 'int', nullable: true })
  idOrdenServicio: number | null;

  @ManyToOne(
    () => OrdenServicio,
    (ordenServicio) => ordenServicio.liquidaciones,
    { nullable: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
  )
  @JoinColumn({ name: 'idOrdenServicio' })
  ordenServicio: OrdenServicio | null;

  // relación con adicional -> SOLO APLICA SI ESTA LIQUIDACION ES DE UN ADICIONAL (no de una orden de servicio, ver idOrdenServicio)
  @Column({ name: 'idAdicional', type: 'int', nullable: true })
  idAdicional: number | null;

  @ManyToOne(
    () => Adicional,
    (adicional) => adicional.liquidaciones,
    { nullable: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
  )
  @JoinColumn({ name: 'idAdicional' })
  adicional: Adicional | null;

  // DESGLOSE DEL VALOR LIQUIDADO CUANDO ES DE UN ADICIONAL (snapshot tomado del Adicional al momento de liquidar, para
  // que una edicion posterior del precio del adicional no altere liquidaciones ya generadas). Cuando la liquidacion es
  // de una orden de servicio, este desglose vive en liquidacionServiciosOrdenServicio (una fila por cada servicio), asi
  // que estos campos quedan en null
  @Column({ name: 'costosDirectos', type: 'decimal', precision: 20, scale: 2, nullable: true })
  costosDirectos: number | null;

  @Column({ name: 'seguroVida', type: 'decimal', precision: 20, scale: 2, nullable: true })
  seguroVida: number | null;

  @Column({ name: 'aui', type: 'decimal', precision: 20, scale: 2, nullable: true })
  aui: number | null;

  @Column({ name: 'precioAntesIva', type: 'decimal', precision: 20, scale: 2, nullable: true })
  precioAntesIva: number | null;

  @Column({ name: 'iva', type: 'decimal', precision: 20, scale: 2, nullable: true })
  iva: number | null;

  // relación con grupo_liquidaciones
  @Column({ 
    name: 'idGrupoLiquidacion', 
    type: 'int' 
  })
  idGrupoLiquidacion: number;

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

  @Column({ 
    type: 'boolean', 
    default: false 
  })
  estado: boolean;

  @CreateDateColumn({
    name: 'fechaCreacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 0,
  })
  fechaCreacion: Date;

  @OneToMany(
    () => LiquidacionServicioOrdenServicio,
    (liquidacionServicioOrdenServicio) => liquidacionServicioOrdenServicio.idLiquidacion,
    {
      eager: true
    }
  )
  liquidacionServiciosOrdenServicio: LiquidacionServicioOrdenServicio[];

}