import { Column, OneToOne, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrdenServicioId } from "./orden-servicio-id.entity";
import { User } from "../../users/entities/user.entity";
import { EstadoOrdenServicio } from "../../common/entities";
import { Locacion, Cliente } from "../../clientes/entities";
import { OrdenServicioDetalle } from "./orden-servicio-detalle.entity";
import { ObservacionOrdenServicio } from "./observaciones-orden.entity";
import { Liquidacione } from "src/liquidaciones/entities/liquidacione.entity";
import { OrigenServicioEnum } from "../interfaces/origen-servicio.interface";

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
    // Solo aplica cuando el tipo de servicio de la orden es "Vigilancia y escolta". Es null si es "Monitoreo de alarmas" (ver idCliente)
    @ManyToOne(
        () => Locacion,
        (locacion) => locacion.ordenesServicio,
        {
            nullable: true,
            eager: true
        }
    )
    @JoinColumn({name: 'idLocacion'})
    idLocacion: Locacion | null;

    // Cliente al que se le asigna directamente la orden de servicio -> relacion
    // Solo aplica cuando el tipo de servicio de la orden es "Monitoreo de alarmas". Es null si es "Vigilancia y escolta" (ver idLocacion)
    @ManyToOne(
        () => Cliente,
        (cliente) => cliente.ordenesServicio,
        {
            nullable: true,
            eager: true
        }
    )
    @JoinColumn({name: 'idCliente'})
    idCliente: Cliente | null;

    @Column({
        type: 'enum',
        enum: OrigenServicioEnum,
        name: 'origenServicio',
        nullable: false
    })
    origenServicio: string; 
    
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

    // COBRO PARCIAL MENSUAL (opcional, solo ordenes indefinidas de catalogo): rango de dias de cada mes que se cobra
    // al liquidar (ej: 1 y 15 = del 1 al 15 de cada mes). Siempre dentro del mismo mes (diaInicioCobro <= diaFinCobro).
    // null en ambos = se cobra el mes completo, como cualquier orden indefinida (ver rangoLiquidadoEnMes en liquidaciones)
    @Column({
        type: 'int',
        name: 'diaInicioCobro',
        nullable: true
    })
    diaInicioCobro: number | null;

    @Column({
        type: 'int',
        name: 'diaFinCobro',
        nullable: true
    })
    diaFinCobro: number | null;

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
        () => OrdenServicioDetalle, 
        (ordenServicioDetalle) => ordenServicioDetalle.idOrdenServicio, 
        {
            cascade: true,
            eager: true
        }
    )
    detalles: OrdenServicioDetalle[];
  
    @OneToMany(
        () => Liquidacione, 
        (liq) => liq.ordenServicio,
        {
            cascade: true
        }
    )
    liquidaciones: Liquidacione[];

}