import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Periodo } from "../../periodos/entities/periodo.entity";
import { Servicio } from "../../servicios/entities";
import { TipoTarifa } from "./tipo-tarifa.entity";
import { OrdenServicioTarifa } from "../../orden-servicio/entities/orden-servicio-tarifa.entity";
import { LiquidacionServicioOrdenServicio } from "../../liquidaciones/entities/liquidacion_servicio_orden_servicio.entity";

@Entity({name: 'tarifa'})
export class Tarifa {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTarifa',
    })
    idTarifa: number;
    
    // periodo -> relacion
    @ManyToOne(
        () => Periodo,
        (periodo) => periodo.tarifas,
        // {
        //     eager: true
        // }
    )
    @JoinColumn({name: 'idPeriodo'})
    idPeriodo: Periodo;
    
    // periodo -> relacion
    @ManyToOne(
        () => Servicio,
        (servicio) => servicio.tarifas,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idServicio'})
    idServicio: Servicio;
    
    // tipo tarifa -> relacion
    @ManyToOne(
        () => TipoTarifa,
        (tipoTarifa) => tipoTarifa.tarifas,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTipoTarifa'})
    idTipoTarifa: TipoTarifa;

    // COSTOS DIRECTOS
    @Column({
        type: 'decimal',
        name: 'costosDirectos',
        precision: 15,
        scale: 2
    })
    costosDirectos: number;
    
    // SEGURO VIDA
    @Column({
        type: 'decimal',
        name: 'seguroVida',
        precision: 15,
        scale: 2,
        nullable: true
    })
    seguroVida: number | null;
    
    // COSTOS DIRECTOS + SEGURO VIDA
    @Column({
        type: 'decimal',
        name: 'costosDirectosSeguroVida',
        precision: 15,
        scale: 2
    })
    costosDirectosSeguroVida: number;
    
    // AUI
    @Column({
        type: 'decimal',
        name: 'aui',
        precision: 15,
        scale: 2
    })
    aui: number;
    
    // PRECIO ANTES IVA
    @Column({
        type: 'decimal',
        name: 'precioAntesIva',
        precision: 15,
        scale: 2
    })
    precioAntesIva: number;

    // IVA
    @Column({
        type: 'decimal',
        name: 'iva',
        precision: 15,
        scale: 2
    })
    iva: number;

    // PRECIO TOTAL CON IVA
    @Column({
        type: 'decimal',
        name: 'precioTotal',
        precision: 15,
        scale: 2
    })
    precioTotal: number;

    // ESTADO
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    // FECHA ASIGNACION
    @CreateDateColumn({
        type: 'datetime',
        name: 'fechaCreacion'
    }) 
    fechaCreacion: Date; 
    
    // FECHA ACTUALIZACION
    @UpdateDateColumn({
        type: 'datetime',
        name: 'fechaActualizacion'
    }) 
    fechaActualizacion: Date;

    @OneToMany(
        () => OrdenServicioTarifa,
        (ordenServicioTarifa) => ordenServicioTarifa.idTarifa
    )
    ordenesServicio: OrdenServicioTarifa[];

    @OneToMany(
        () => LiquidacionServicioOrdenServicio,
        (liquidacionServicioOrdenServicio) => liquidacionServicioOrdenServicio.idTarifa,
    )
    liquidacionServiciosOrdenServicio: LiquidacionServicioOrdenServicio[];

}
