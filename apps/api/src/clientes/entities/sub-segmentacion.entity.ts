import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Segmentacion } from "./segmentacion.entity";
import { Cliente } from "./cliente.entity";

@Entity({name: "sub_segmentacion_cliente"})
export class SubSegmentacion {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idSubSegmentacion',
    })
    idSubSegmentacion: number;
    
    @Column({
        type: 'varchar',
        length: 100,
        name: 'descripcion',
    })
    descripcion: string;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @ManyToOne(
        () => Segmentacion,
        (segmentacion) => segmentacion.subSegmentaciones,
        {
            onDelete: 'CASCADE',
            eager: true
        }
    )
    @JoinColumn({name: 'idSegmentacion'})
    segmentacion: Segmentacion;

    @OneToMany(
        () => Cliente, 
        (cliente) => cliente.idSubSegmentacion
    )
    clientes: Cliente[];

}