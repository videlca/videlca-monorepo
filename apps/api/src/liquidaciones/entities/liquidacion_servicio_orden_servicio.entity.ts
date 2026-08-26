import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Liquidacione } from "./liquidacione.entity";
import { Tarifa } from "../../tarifas/entities";

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
    // Toda fila de OrdenServicioDetalle tiene siempre una tarifa (ya no existen servicios de horario mixto por hora
    // sin tarifa guardada), por lo que esta relacion es obligatoria. El servicio liquidado se obtiene a traves de
    // idTarifa.idServicio, no hace falta guardarlo aparte
    @ManyToOne(
        () => Tarifa,
        (tarifa) => tarifa.liquidacionServiciosOrdenServicio,
        {
            eager: true,
            nullable: false
        }
    )
    @JoinColumn({name: 'idTarifa'})
    idTarifa: Tarifa;

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
