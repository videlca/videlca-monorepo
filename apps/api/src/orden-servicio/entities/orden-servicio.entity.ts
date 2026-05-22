import { Column, OneToOne, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrdenServicioId } from "./orden-servicio-id.entity";
import { User } from "../../users/entities/user.entity";
import { EstadoOrdenServicio } from "../../common/entities";
import { Locacion } from "../../clientes/entities";
import { OrdenServicioTarifa } from "./orden-servicio-tarifa.entity";
import { ObservacionOrdenServicio } from "./observaciones-orden.entity";
import { Liquidacione } from "src/liquidaciones/entities/liquidacione.entity";

@Entity({name: "orden_servicio"})
export class OrdenServicio {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idOrdenServicio',
    })
    idOrdenServicio: number;

    // ORDEN SERVICIO ID -> relacion
    @OneToOne(
      () => OrdenServicioId,
      ordenServicioId => ordenServicioId.ordenServicio,
      {
        nullable: false,
        eager: true,
        cascade: true, // 🔥 Esto hace que al borrar OrdenServicio también borre el ID
        onDelete: 'CASCADE',
      },
    )
    @JoinColumn({ name: 'OrdenServicioId' })
    ordenServicioId: OrdenServicioId;

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
    
    @Column({
        type: 'date',
        name: 'fechaInicio',
        nullable: false
    })
    fechaInicio: Date; // campo para identificar fecha inicial de la orden / UTILIZAR PARA LIQUIDAR

    @Column({
        type: 'date',
        name: 'fechaFin',
        nullable: true
    })
    fechaFin: Date | null; // campo para identificar fecha inicial de la orden / UTILIZAR PARA LIQUIDAR
    
    @Column({
        type: 'date',
        name: 'fechaInicioOrden',
        nullable: false
    })
    fechaInicioOrden: Date; // Campo para saber si la fecha se modifico / FECHA DE CUANDO SE CREO LA ORDEN

    @Column({
        type: 'date',
        name: 'fechaFinOrden',
        nullable: true
    })
    fechaFinOrden: Date | null; // Campo para saber si la fecha se modifico / FECHA DE CUANDO SE CREO LA ORDEN
    
    // PRECIO TOTAL CON IVA
    @Column({
        type: 'decimal',
        name: 'precioTotal',
        precision: 30,
        scale: 2,
        nullable: true
    })
    precioTotal: number | null;

    // FECHA CREACION
    @Column({
        type: 'date',
        name: 'fechaCreacion',
        nullable: false
    }) 
    fechaCreacion: Date; 
    
    // FECHA CREACION
    @Column({
        type: 'date',
        name: 'fechaActualizacion',
        nullable: false
    }) 
    fechaActualizacion: Date; 

    @OneToMany(
        () => ObservacionOrdenServicio,
        (observacionOrdenServicio) => observacionOrdenServicio.idOrdenServicio,
        {cascade: true}
    )
    observacionesOrdenServicio: ObservacionOrdenServicio[];

    @OneToMany(
        () => OrdenServicioTarifa, 
        (ordenServicioTarifa) => ordenServicioTarifa.idOrdenServicio, 
        {
            cascade: true,
            eager: true
        }
    )
    tarifas: OrdenServicioTarifa[];
  
    @OneToMany(
        () => Liquidacione, 
        (liq) => liq.ordenServicio,
        {
            cascade: true
        }
    )
    liquidaciones: Liquidacione[];


}