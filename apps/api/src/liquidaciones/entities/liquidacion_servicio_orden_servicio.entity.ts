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

    // COPIA ("snapshot") DE COMO ESTABA EL SERVICIO EN LA ORDEN AL MOMENTO DE LIQUIDAR. La orden se puede editar despues
    // (fechas y dias de la semana, ver updateOrdenServicio) y esa edicion solo aplica a los meses que aun no se han
    // liquidado: el detalle/PDF/anexo de un mes ya liquidado debe seguir mostrando lo que realmente se cobro, por eso se
    // leen de aca y no del detalle actual de la orden. Nulos solo en filas creadas antes de esta funcionalidad (en ese
    // caso se cae a los datos actuales de la orden, que hasta entonces no se podian editar)
    // fecha: solo ordenes "a_medida" (cada fila liquidada es un dia); en catalogo queda null
    @Column({ type: 'date', name: 'fecha', nullable: true })
    fecha: Date | string | null;

    @Column({ type: 'varchar', length: 8, name: 'horaInicio', nullable: true })
    horaInicio: string | null;

    @Column({ type: 'varchar', length: 8, name: 'horaFin', nullable: true })
    horaFin: string | null;

    @Column({ type: 'boolean', name: 'lunes', nullable: true })
    lunes: boolean | null;

    @Column({ type: 'boolean', name: 'martes', nullable: true })
    martes: boolean | null;

    @Column({ type: 'boolean', name: 'miercoles', nullable: true })
    miercoles: boolean | null;

    @Column({ type: 'boolean', name: 'jueves', nullable: true })
    jueves: boolean | null;

    @Column({ type: 'boolean', name: 'viernes', nullable: true })
    viernes: boolean | null;

    @Column({ type: 'boolean', name: 'sabado', nullable: true })
    sabado: boolean | null;

    @Column({ type: 'boolean', name: 'domingo', nullable: true })
    domingo: boolean | null;

    @Column({ type: 'boolean', name: 'incluyeFestivos', nullable: true })
    incluyeFestivos: boolean | null;

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
