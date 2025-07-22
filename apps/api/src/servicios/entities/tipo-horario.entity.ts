import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TipoHorarioDescripcion } from ".";

@Entity({name: "tipo_horario"})
export class TipoHorario {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoHorario',
    })
    idTipoHorario: number;

    // tipo horario descripcion -> relacion
    @ManyToOne(
        () => TipoHorarioDescripcion,
        (tipoHorarioDescripcion) => tipoHorarioDescripcion.horarios,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTipoHorarioDescripcion'})
    idTipoHorarioDescripcion: TipoHorarioDescripcion;
    
    @Column({
        type: 'varchar',
        length: 8,
        name: 'horaInicio',
        nullable: false
    })
    horaInicio: string; // Formato 'HH:mm:ss'
    
    @Column({
        type: 'varchar',
        length: 8,
        name: 'horaFin',
        nullable: false
    })
    horaFin: string; // Formato 'HH:mm:ss'

    @Column({
        type: 'date',
        name: 'fechaVigenciaInicio',
        nullable: false
    })
    fechaVigenciaInicio: Date;

    @Column({
        type: 'date',
        name: 'fechaVigenciaFin',
        nullable: true
    })
    fechaVigenciaFin: Date | null;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

}