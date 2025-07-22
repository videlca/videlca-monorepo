import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';

import { IsNotEmpty, Min, Max, Length } from 'class-validator';
import { Tarifa } from '../../tarifas/entities';

@Entity('periodo')
@Index(['mesInicio', 'anioInicio', 'mesFin', 'anioFin'], { unique: true })
@Index(['fechaInicio', 'fechaFin'])
@Index(['estado'])
@Index(['periodoActivoFacturacion'])
export class Periodo {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idPeriodo'
    })
    idPeriodo: number;

    @Column({ 
        type: 'varchar', 
        name: 'nombre',
        length: 100 
    })
    @IsNotEmpty()
    @Length(1, 100)
    nombre: string;

    @Column({ 
        type: 'int',
        name: 'mesInicio' 
    })
    @Min(1)
    @Max(12)
    mesInicio: number;

    @Column({ 
        type: 'int',
        name: 'anioInicio' 
    })
    @Min(2020)
    anioInicio: number;

    @Column({ 
        type: 'int',
        name: 'mesFin' 
    })
    @Min(1)
    @Max(12)
    mesFin: number;

    @Column({ 
        type: 'int',
        name: 'anioFin' 
    })
    @Min(2020)
    anioFin: number;

    @Column({ 
        type: 'date',
        name: 'fechaInicio' 
    })
    fechaInicio: Date;

    @Column({ 
        type: 'date',
        name: 'fechaFin' 
    })
    fechaFin: Date;

    @Column({ 
        type: 'boolean',
        name: 'estado', 
        default: true 
    })
    estado: boolean;

    @Column({ 
        type: 'boolean',
        name: 'periodoActivoFacturacion', 
        default: false 
    })
    periodoActivoFacturacion: boolean;

    @OneToMany(
        () => Tarifa, 
        (tarifa) => tarifa.idPeriodo, 
    )
    tarifas: Tarifa[];

}