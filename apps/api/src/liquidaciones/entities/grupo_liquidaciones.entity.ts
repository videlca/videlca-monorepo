// src/grupo-liquidaciones/entities/grupo-liquidacion.entity.ts
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Liquidacione } from '../../liquidaciones/entities/liquidacione.entity';
import { NumeroPedido } from '../../liquidaciones/entities/numero_pedido.entity';
import { ObservacionGrupoOrdenServicio } from '../../liquidaciones/entities/observacion-grupo-orden-servicio.entity';
import { Cliente } from '../../clientes/entities';

@Entity({ name: 'grupo_liquidaciones' })
export class GrupoLiquidacion {

  @PrimaryGeneratedColumn({
    name: 'idGrupoLiquidacion',
    type: 'int'
  })
  idGrupoLiquidacion: number;

  // Cliente al que pertenece este grupo de liquidacion -> relacion. Nullable a nivel de BD para no romper los grupos
  // historicos creados antes de esta relacion (que mezclaban varios clientes en un mismo grupo); generarGrupoMensual
  // exige idCliente en el DTO, asi que todo grupo nuevo siempre lo tiene
  @ManyToOne(
    () => Cliente,
    (cliente) => cliente.gruposLiquidacion,
    { nullable: true, eager: true }
  )
  @JoinColumn({ name: 'idCliente' })
  idCliente: Cliente | null;

  @Column({
    type: 'boolean',
    default: false
  })
  estado: boolean;

  @Column({ 
    type: 'double', 
    default: 0 
  })
  total: number;

  @Column({ 
    type: 'varchar', 
    default: "" 
  })
  descripcion: string;

  @CreateDateColumn({
    name: 'fechaCreacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 0,
  })
  fechaCreacion: Date;

  @Column({ 
    type: 'boolean', 
    default: false 
  })
  consolidacion_orden?: boolean;

  @Column({ 
    type: 'boolean', 
    default: false 
  })
  generacion_interfase?: boolean;

  @Column({ 
    type: 'boolean', 
    default: false 
  })
  generacion_anexo?: boolean;

  @OneToMany(
    () => Liquidacione, 
    (liquidacion) => liquidacion.grupo
  )
  liquidaciones: Liquidacione[];
  
  @OneToMany(
    () => NumeroPedido, 
    (numeroPedido) => numeroPedido.idGrupoLiquidacion
  )
  numerosPedido: NumeroPedido[];

  @OneToMany(
    () => ObservacionGrupoOrdenServicio,
    (observacionGrupoOrdenServicio) => observacionGrupoOrdenServicio.idGrupoOrdenServicio,
    {cascade: true}
  )
  observacionesGrupoOrdenServicio: ObservacionGrupoOrdenServicio[];
  
}