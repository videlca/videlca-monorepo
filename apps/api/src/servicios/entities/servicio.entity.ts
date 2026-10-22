import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Max, Min } from "class-validator";
import { TipoServicio, TipoDuracion, TipoHorarioDescripcion } from ".";
import { Tarifa, TipoTarifa } from '../../tarifas/entities';

@Entity({name: 'servicio'})
export class Servicio {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idServicio',
    })
    idServicio: number;

    // Codigo de servicio
    @Column({
        type: 'varchar',
        name: 'codigo',
        length: 10
    })
    codigo: string;    

    // nombre
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 100 
    })
    descripcion: string;

    // tipo servicio -> relacion
    @ManyToOne(
        () => TipoServicio,
        (tipoServicio) => tipoServicio.servicios,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoServicio'})
    idTipoServicio: TipoServicio;

    // tipo Duracion -> relacion
    @ManyToOne(
        () => TipoDuracion,
        (tipoDuracion) => tipoDuracion.servicios,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTipoDuracion'})
    idTipoDuracion: TipoDuracion;

    // tipo tarifa -> relacion
    @ManyToOne(
        () => TipoTarifa,
        (tipoTarifa) => tipoTarifa.servicios,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTipoTarifa'})
    idTipoTarifa: TipoTarifa;

    // tipo horario descripcion -> relacion
    @ManyToOne(
        () => TipoHorarioDescripcion,
        (tipoHorarioDescripcion) => tipoHorarioDescripcion.servicios,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTipoHorarioDescripcion'})
    idTipoHorarioDescripcion: TipoHorarioDescripcion;

    @Column({ 
        type: 'int',
        name: 'horasFijas',
        nullable: false 
    })
    @Min(1)
    @Max(24)
    horasFijas: number;

    // dominical
    @Column({
        type: 'boolean',
        name: 'dominical',
        default: false
    })
    dominical: boolean;

    // armado
    @Column({
        type: 'boolean',
        name: 'armado',
        default: false
    })
    armado: boolean;

    // estado
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;
    
    @OneToMany(
        () => Tarifa, 
        (tarifa) => tarifa.idServicio, 
    )
    tarifas: Tarifa[];

}
