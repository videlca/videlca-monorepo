import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Servicio, TipoHorario } from ".";

@Entity({name: "tipo_horario_descripcion"})
export class TipoHorarioDescripcion {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoHorarioDescripcion',
    })
    idTipoHorarioDescripcion: number;
    
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

    @OneToMany(
        () => Servicio, 
        (servicio) => servicio.idTipoHorarioDescripcion
    )
    servicios: Servicio[];
    
    @OneToMany(
        () => TipoHorario, 
        (tipoHorario) => tipoHorario.idTipoHorarioDescripcion
    )
    horarios: TipoHorario[];

}