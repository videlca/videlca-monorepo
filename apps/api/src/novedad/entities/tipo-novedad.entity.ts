import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Novedad } from "../entities";

@Entity({name: "tipo_novedad"})
export class TipoNovedad {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoNovedad',
    })
    idTipoNovedad: number;
    
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
    
    @Column({
        type: 'boolean',
        name: 'retirado',
        default: false,
        select: false
    })
    retirado: boolean;

    @OneToMany(
        () => Novedad, 
        (novedad) => novedad.idTipoNovedad
    )
    novedades: Novedad[];

}