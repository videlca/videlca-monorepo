import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TipoTarifa } from "./tipo-tarifa.entity";

@Entity({name: "tipo_unidad_tiempo"})
export class TipoUnidadTiempo {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoUnidadTiempo',
    })
    idTipoUnidadTiempo: number;
    
    @Column({
        type: 'varchar',
        length: 100,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;

    @Column({
        type: 'boolean',
        name: 'requiereTiempo',
        default: true
    })
    requiereTiempo: boolean;
    
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @OneToMany(
        () => TipoTarifa, 
        (tipoTarifa) => tipoTarifa.idTipoUnidadTiempo
    )
    tiposTarifa: TipoTarifa[];

}