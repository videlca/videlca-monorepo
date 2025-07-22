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
        length: 100,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

}