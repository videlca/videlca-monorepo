import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrdenServicio } from "./orden-servicio.entity";
import { Tarifa } from "../../tarifas/entities";
import { Servicio } from "../../servicios/entities";
import { ProgramacionPersonal } from "./programacion-personal.entity";
import { CostoHoraOrdenServicioTarifa } from "./orden-servicio-tarifa-costo-hora.entity";

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
    // Nullable: los servicios de horario mixto por hora no tienen una tarifa guardada (su precio depende
    // del valor hora del periodo activo de facturacion), en ese caso esta columna queda en null
    @ManyToOne(
        () => Tarifa,
        (tarifa) => tarifa.ordenesServicio,
        {
            eager: true,
            nullable: true
        }
    )
    @JoinColumn({name: 'idTarifa'})
    idTarifa: Tarifa | null;

    // servicio de la orden -> relacion
    // Se guarda siempre (incluso cuando idTarifa existe) para no depender de idTarifa a la hora de saber que servicio es
    @ManyToOne(
        () => Servicio,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idServicio'})
    idServicio: Servicio;

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

    @OneToMany(
        () => ProgramacionPersonal,
        (programacion) => programacion.idOrdenServicioTarifa,
        {
            cascade: true,
        }
    )
    programaciones: ProgramacionPersonal[];

    // DESGLOSE HORA A HORA DEL PRECIO (solo tiene datos cuando el servicio es de horario mixto por hora)
    @OneToMany(
        () => CostoHoraOrdenServicioTarifa,
        (costoHora) => costoHora.idOrdenServicioTarifa,
        {
            cascade: true,
            eager: true
        }
    )
    costosHoras: CostoHoraOrdenServicioTarifa[];

}