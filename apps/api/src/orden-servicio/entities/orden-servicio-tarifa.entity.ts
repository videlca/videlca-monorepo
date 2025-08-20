import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrdenServicio } from "./orden-servicio.entity";
import { Tarifa } from "../../tarifas/entities";
import { ProgramacionPersonal } from "./programacion-personal.entity";

@Entity({name: "orden_servicio_tarifa"})
export class OrdenServicioTarifa {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idOrdenServicioTarifa',
    })
    idOrdenServicioTarifa: number;

    // orden de servicio -> relacion
    @ManyToOne(
        () => OrdenServicio,
        (ordenServicio) => ordenServicio.tarifas,
        {
            onDelete: 'CASCADE'
        }
    )
    @JoinColumn({name: 'idOrdenServicio'})
    idOrdenServicio: OrdenServicio;
    
    // tarifa de la orden de servicio -> relacion
    @ManyToOne(
        () => Tarifa,
        (tarifa) => tarifa.ordenesServicio,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTarifa'})
    idTarifa: Tarifa;
    
    @Column({
        type: 'int',
        name: 'cantidadPersonal',
        default: 0
    })
    cantidadPersonal: number; 

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
    
    // PRECIO TOTAL DEL SERVICIO EN EL TIEMPO PRESTADO
    @Column({
        type: 'decimal',
        name: 'precio',
        precision: 20,
        scale: 2,
        nullable: true
    })
    precio: number | null;

    @OneToMany(
        () => ProgramacionPersonal, 
        (programacion) => programacion.idOrdenServicioTarifa, 
        {
            cascade: true,
        }
    )
    programaciones: ProgramacionPersonal[];

}