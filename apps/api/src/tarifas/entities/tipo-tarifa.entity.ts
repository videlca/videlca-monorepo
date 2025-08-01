import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Max, Min } from "class-validator";
import { TipoUnidadTiempo } from "./tipo-unidad-tiempo.entity";
import { Tarifa } from '../entities';


@Entity({name: 'tipo_tarifa'})
export class TipoTarifa {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoTarifa',
    })
    idTipoTarifa: number;
    
    // nombre
    @Column({
        type: 'varchar',
        name: 'nombre',
        length: 30
    })
    nombre: string;
    
    // nombre
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 255
    })
    descripcion: string;

    // tipo unidad tiempo -> relacion
    @ManyToOne(
        () => TipoUnidadTiempo,
        (tipoUnidadTiempo) => tipoUnidadTiempo.tiposTarifa,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoUnidadTiempo'})
    idTipoUnidadTiempo: TipoUnidadTiempo;

    @Column({ 
        type: 'int',
        name: 'cantidadTiempo',
        nullable: true 
    })
    @Min(1)
    @Max(31)
    cantidadTiempo: number;

    // estado
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @OneToMany(
        () => Tarifa, 
        (tarifa) => tarifa.idTipoTarifa, 
    )
    tarifas: Tarifa[];

}
