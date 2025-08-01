import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Correo } from "../../../clientes/entities";
import { OrdenServicio } from "../../../orden-servicio/entities/orden-servicio.entity";

@Entity({name: "estado_orden_servicio"})
export class EstadoOrdenServicio {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idEstadoOrdenServicio',
    })
    idEstadoOrdenServicio: number;

    @Column({
        type: 'varchar',
        length: 100,
        name: 'nombre',
        unique: true,
        nullable: false
    })
    nombre: string;
    
    @Column({
        type: 'varchar',
        length: 255,
        name: 'descripcion',
        nullable: false
    })
    descripcion: string;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;
    
    @Column({
        type: 'boolean',
        name: 'programable',
        default: false
    })
    programable: boolean;

    @ManyToMany(
        () => Correo, 
        (correo) => correo.estados
    )
    correos: Correo[];

    @OneToMany(
        () => OrdenServicio,
        (ordenServicio) => ordenServicio.idEstadoOrdenServicio
    )
    ordenesServicio: OrdenServicio[];

}