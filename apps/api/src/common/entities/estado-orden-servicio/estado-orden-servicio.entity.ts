import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Correo } from "../../../clientes/entities";

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
    
    @Column({
        type: 'boolean',
        name: 'programable',
        default: false
    })
    programable: boolean;
    
    @Column({
        type: 'int',
        name: 'dias',
        default: 0,
    })
    dias: number;

    @ManyToMany(
        () => Correo, 
        (correo) => correo.estados
    )
    correos: Correo[];

}