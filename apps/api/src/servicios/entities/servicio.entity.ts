import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Max, Min } from "class-validator";
import { TipoServicio, TipoDuracion, TipoHorarioDescripcion } from ".";

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
        length: 10,
        unique: true 
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
        nullable: true 
    })
    @Min(1)
    @Max(24)
    horasFijas: number;
    
    @Column({ 
        type: 'int',
        name: 'horasMinimas',
        nullable: true 
    })
    @Min(1)
    @Max(24)
    horasMinimas: number;
    
    @Column({ 
        type: 'int',
        name: 'horasMaximas',
        default: 24,
        nullable: true 
    })
    @Min(1)
    @Max(24)
    horasMaximas: number;

    // estado
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

}
