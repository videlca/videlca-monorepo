import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Servicio } from ".";

@Entity({name: "tipo_duracion"})
export class TipoDuracion {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoDuracion',
    })
    idTipoDuracion: number;
    
    @Column({
        type: 'varchar',
        length: 100,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @OneToMany(
        () => Servicio, 
        (servicio) => servicio.idTipoDuracion
    )
    servicios: Servicio[];

}