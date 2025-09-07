import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Personal } from "./personal.entity";

@Entity({name: "tipo_contrato"})
export class TipoContrato {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoContrato',
    })
    idTipoContrato: number;
    
    @Column({
        type: 'varchar',
        length: 100,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;

    @Column({
        type: 'boolean',
        name: 'indefinido',
        default: false
    })
    indefinido: boolean;
    
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @OneToMany(
        () => Personal, 
        (personal) => personal.idTipoContrato
    )
    personal: Personal[];

}