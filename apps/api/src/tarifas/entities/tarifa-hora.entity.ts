import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Periodo } from "../../periodos/entities/periodo.entity";
import { TarifaHoraDescripcion } from "./tarifa-hora-descripcion.entity";

@Entity({name: 'tarifa_hora'})
export class TarifaHora {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTarifaHora',
    })
    idTarifaHora: number;    
    
    // periodo -> relacion
    @ManyToOne(
        () => Periodo,
        (periodo) => periodo.tarifasHoras,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idPeriodo'})
    idPeriodo: Periodo;
    
    // tarifa hora descripcion -> relacion
    @ManyToOne(
        () => TarifaHoraDescripcion,
        (tarifaHoraDescripcion) => tarifaHoraDescripcion.tarifasHoras,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTarifaHoraDescripcion'})
    idTarifaHoraDescripcion: TarifaHoraDescripcion;

    // PRECIO
    @Column({
        type: 'decimal',
        name: 'precio',
        precision: 15,
        scale: 2
    })
    precio: number;

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

}
