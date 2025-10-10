// src/grupo-liquidaciones/entities/grupo-liquidacion.entity.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Liquidacione } from 'src/liquidaciones/entities/liquidacione.entity';

@Entity({ name: 'grupo_liquidaciones' })
export class GrupoLiquidacion {

  @PrimaryGeneratedColumn({ 
    name: 'idGrupoLiquidacion', 
    type: 'int' 
  })
  idGrupoLiquidacion: number;

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
}