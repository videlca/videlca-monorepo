import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrdenServicio } from "./orden-servicio.entity";
import { Tarifa } from "../../tarifas/entities";

@Entity({name: "orden_servicio_detalle"})
export class OrdenServicioDetalle {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idOrdenServicioDetalle',
    })
    idOrdenServicioDetalle: number;

    // orden de servicio -> relacion
    @ManyToOne(
        () => OrdenServicio,
        (ordenServicio) => ordenServicio.detalles,
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
        name: 'cantidadHoras',
        nullable: true
    })
    cantidadHoras: number | null;

    // DIA CALENDARIO AL QUE PERTENECE ESTA FILA. Solo aplica para ordenes de origen "a_medida" (cada fila = un dia),
    // ya que ahi se necesita saber la fecha exacta de cada fila para poder liquidar solo los dias de un mes especifico
    // cuando la orden abarca varios meses. Las ordenes "catalogo" quedan en null (su fila cubre todo el rango de fechas
    // de la orden, no un dia especifico)
    @Column({
        type: 'date',
        name: 'fecha',
        nullable: true
    })
    fecha: Date | null;

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

    // DESGLOSE DEL PRECIO DEL SERVICIO. Todos nulos si la orden es indefinida (fechaFin null), ya que en ese caso
    // el precio se calcula mes a mes al momento de liquidar/finalizar, no se conoce de antemano
    @Column({
        type: 'decimal',
        name: 'costosDirectos',
        precision: 20,
        scale: 2,
        nullable: true
    })
    costosDirectos: number | null;

    @Column({
        type: 'decimal',
        name: 'seguroVida',
        precision: 20,
        scale: 2,
        nullable: true
    })
    seguroVida: number | null;
    
    @Column({
        type: 'decimal',
        name: 'costosDirectosSeguroVida',
        precision: 20,
        scale: 2,
        nullable: true
    })
    costosDirectosSeguroVida: number | null;

    @Column({
        type: 'decimal',
        name: 'aui',
        precision: 20,
        scale: 2,
        nullable: true
    })
    aui: number | null;

    @Column({
        type: 'decimal',
        name: 'precioAntesIva',
        precision: 20,
        scale: 2,
        nullable: true
    })
    precioAntesIva: number | null;

    @Column({
        type: 'decimal',
        name: 'iva',
        precision: 20,
        scale: 2,
        nullable: true
    })
    iva: number | null;

    // PRECIO TOTAL DEL SERVICIO EN EL TIEMPO PRESTADO
    @Column({
        type: 'decimal',
        name: 'precio',
        precision: 20,
        scale: 2,
        nullable: true
    })
    precio: number | null;

}