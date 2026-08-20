import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Liquidacione } from "./liquidacione.entity";
import { Tarifa } from "../../tarifas/entities";
import { Servicio } from "../../servicios/entities";

@Entity({name: 'liquidacion_servicio_orden_servicio'})
export class LiquidacionServicioOrdenServicio {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idLiquidacionServicioOrdenServicio',
    })
    idLiquidacionServicioOrdenServicio: number;

    // liquidacion de orden -> relacion
    @ManyToOne(
        () => Liquidacione,
        (liquidacion) => liquidacion.liquidacionServiciosOrdenServicio,
    )
    @JoinColumn({name: 'idLiquidacion'})
    idLiquidacion: Liquidacione;

    // tarifa -> relacion
    // Nullable: los servicios de horario mixto por hora no tienen una tarifa guardada (su precio depende
    // del valor hora del periodo activo de facturacion), en ese caso esta columna queda en null
    @ManyToOne(
        () => Tarifa,
        (tarifa) => tarifa.liquidacionServiciosOrdenServicio,
        {
            eager: true,
            nullable: true
        }
    )
    @JoinColumn({name: 'idTarifa'})
    idTarifa: Tarifa | null;

    // servicio liquidado -> relacion
    // Se guarda siempre (incluso cuando idTarifa existe) para no depender de idTarifa a la hora de saber que servicio es
    @ManyToOne(
        () => Servicio,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idServicio'})
    idServicio: Servicio;

    // COSTOS DIRECTOS
    @Column({
        type: 'decimal',
        name: 'costosDirectos',
        precision: 15,
        scale: 2
    })
    costosDirectos: number;
    
    // Seguro vida
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

}
