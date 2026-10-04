import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Servicio } from ".";

@Entity({name: "tipo_servicio"})
export class TipoServicio {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoServicio',
    })
    idTipoServicio: number;

    @Column({
        type: 'varchar',
        length: 100,
        name: 'nombre',
        unique: true,
    })
    nombre: string;
    
    @Column({
        type: 'varchar',
        length: 100,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;
    
    @Column({
        type: 'varchar',
        length: 10,
        name: 'prefijo',
        unique: true
    })
    prefijo: string;

    @Column({
        type: 'boolean',
        name: 'requierePersonal',
        default: true
    })
    requierePersonal: boolean;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @OneToMany(
        () => Servicio, 
        (servicio) => servicio.idTipoServicio
    )
    servicios: Servicio[];

}