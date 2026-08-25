import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Servicio } from ".";

@Entity({name: "tipo_horario_descripcion"})
export class TipoHorarioDescripcion {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoHorarioDescripcion',
    })
    idTipoHorarioDescripcion: number;

    // nombre
    @Column({
        type: 'varchar',
        name: 'nombre',
        length: 30,
        unique: true
    })
    nombre: string;
    
    // descripcion
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 255
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

}