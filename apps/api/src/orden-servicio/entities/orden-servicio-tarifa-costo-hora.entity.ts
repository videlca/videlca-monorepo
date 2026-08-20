import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrdenServicioTarifa } from "./orden-servicio-tarifa.entity";

// DESGLOSE HORA A HORA DEL PRECIO DE UN SERVICIO DE LA ORDEN (unicamente aplica para servicios de horario mixto por hora,
// que se calculan segun tramos diurnos/nocturnos y ordinarios/dominicales-festivos)
@Entity({name: "orden_servicio_tarifa_costo_hora"})
export class CostoHoraOrdenServicioTarifa {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idOrdenServicioTarifaCostoHora',
    })
    idOrdenServicioTarifaCostoHora: number;

    // servicio de la orden al que pertenece este tramo -> relacion
    @ManyToOne(
        () => OrdenServicioTarifa,
        (ordenServicioTarifa) => ordenServicioTarifa.costosHoras,
        {
            onDelete: 'CASCADE'
        }
    )
    @JoinColumn({name: 'idOrdenServicioTarifa'})
    idOrdenServicioTarifa: OrdenServicioTarifa;

    @Column({
        type: 'date',
        name: 'fecha',
        nullable: false
    })
    fecha: Date;

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
        type: 'varchar',
        length: 10,
        name: 'tipoHorario',
        nullable: false
    })
    tipoHorario: 'diurno' | 'nocturno';

    @Column({
        type: 'boolean',
        name: 'dominical',
        default: false
    })
    dominical: boolean;

    @Column({
        type: 'decimal',
        name: 'horas',
        precision: 6,
        scale: 2
    })
    horas: number;

    @Column({
        type: 'decimal',
        name: 'costosDirectos',
        precision: 20,
        scale: 2
    })
    costosDirectos: number;

    @Column({
        type: 'decimal',
        name: 'seguroVida',
        precision: 20,
        scale: 2
    })
    seguroVida: number;

    @Column({
        type: 'decimal',
        name: 'aui',
        precision: 20,
        scale: 2
    })
    aui: number;

}
