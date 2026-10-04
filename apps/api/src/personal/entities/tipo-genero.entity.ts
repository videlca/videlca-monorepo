import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Personal } from "./personal.entity";

@Entity({name: "tipo_genero"})
export class TipoGenero {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoGenero',
    })
    idTipoGenero: number;
    
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
        () => Personal, 
        (personal) => personal.idTipoGenero
    )
    personal: Personal[];

}