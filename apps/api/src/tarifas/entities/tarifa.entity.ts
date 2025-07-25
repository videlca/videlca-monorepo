import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Periodo } from "../../periodos/entities/periodo.entity";
import { Servicio } from "../../servicios/entities";
import { TipoTarifa } from "./tipo-tarifa.entity";

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

    // PRECIO SIN IVA
    @Column({
        type: 'decimal',
        name: 'precioSinIva',
        precision: 15,
        scale: 2
    })
    precioSinIva: number;

    // IVA
    @Column({
        type: 'decimal',
        name: 'iva',
        precision: 7,
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
        type: 'timestamp',
        name: 'fechaCreacion'
    }) 
    fechaCreacion: Date; 
    
    // FECHA ACTUALIZACION
    @UpdateDateColumn({
        type: 'timestamp',
        name: 'fechaActualizacion'
    }) 
    fechaActualizacion: Date;

}
