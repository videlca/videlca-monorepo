import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Personal } from "../entities";

@Entity({name: "tipo_personal"})
export class TipoPersonal {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoPersonal',
    })
    idTipoPersonal: number;
    
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
        (personal) => personal.idTipoPersonal
    )
    personal: Personal[];

}