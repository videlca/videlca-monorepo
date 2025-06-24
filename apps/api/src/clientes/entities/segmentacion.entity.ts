import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SubSegmentacion } from "./sub-segmentacion.entity";

@Entity({name: "segmentacion_cliente"})
export class Segmentacion {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idSegmentacion',
    })
    idSegmentacion: number;
    
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
        () => SubSegmentacion,
        (subSegmentacion) => subSegmentacion.segmentacion,
        { 
            cascade: true, 
        }
    )
    subSegmentaciones: SubSegmentacion[];

}