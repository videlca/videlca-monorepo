import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { EstadoOrdenServicio } from "../../common/entities";
import { Locacion } from "../../clientes/entities";
import { Tarifa } from "../../tarifas/entities";
import { ObservacionOrdenServicio } from "./observaciones-orden.entity";
import { Liquidacione } from "src/liquidaciones/entities/liquidacione.entity";

@Entity({name: "orden-servicio"})
export class OrdenServicio {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idOrdenServicio',
    })
    idOrdenServicio: number;

    // Usuario que creo la orden -> relacion
    @ManyToOne(
        () => User,
        (usuario) => usuario.ordenesServicio,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idUsuarioCreacion'})
    idUsuarioCreacion: User;
    
    // Estado de la orden -> relacion
    @ManyToOne(
        () => EstadoOrdenServicio,
        (estadoOrdenServicio) => estadoOrdenServicio.ordenesServicio,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idEstadoOrdenServicio'})
    idEstadoOrdenServicio: EstadoOrdenServicio;
    
    // Locacion de la orden de servicio -> relacion
    @ManyToOne(
        () => Locacion,
        (locacion) => locacion.ordenesServicio,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idLocacion'})
    idLocacion: Locacion;
    
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
        type: 'date',
        name: 'fechaInicio',
        nullable: false
    })
    fechaInicio: Date;

    @Column({
        type: 'date',
        name: 'fechaFin',
        nullable: true
    })
    fechaFin: Date | null;

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
        type: 'int',
        name: 'horasDescanso',
        default: 0,
    })
    horasDescanso: number;

    // PRECIO TOTAL CON IVA
    @Column({
        type: 'decimal',
        name: 'precio',
        precision: 20,
        scale: 2,
        nullable: true
    })
    precio: number | null;

    // FECHA CREACION
    @Column({
        type: 'date',
        name: 'fechaCreacion',
        nullable: false
    }) 
    fechaCreacion: Date; 

    @OneToMany(
        () => ObservacionOrdenServicio,
        (observacionOrdenServicio) => observacionOrdenServicio.idOrdenServicio,
        {cascade: true}
    )
    observacionesOrdenServicio: ObservacionOrdenServicio[];

    @OneToMany(() => Liquidacione, (liq) => liq.ordenServicio)
    liquidaciones: Liquidacione[];

}