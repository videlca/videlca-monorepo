// src/grupo-liquidaciones/entities/grupo-liquidacion.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Liquidacione } from 'src/liquidaciones/entities/liquidacione.entity';

@Entity({ name: 'grupo_liquidaciones' })
export class GrupoLiquidacion {
  @PrimaryGeneratedColumn({ name: 'idGrupoLiquidacion', type: 'int' })
  idGrupoLiquidacion: number;

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @Column({ type: 'double', default: 0 })
  total: number;

  @OneToMany(() => Liquidacione, (l) => l.grupo)
  liquidaciones: Liquidacione[];
}