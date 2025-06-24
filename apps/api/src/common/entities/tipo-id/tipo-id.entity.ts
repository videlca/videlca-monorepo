import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../../users/entities/user.entity";
import { Personal } from "../../../personal/entities";
import { Cliente } from "../../../clientes/entities";

@Entity({name: "tipo_identificacion"})
export class TipoIdentificacion {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoIdentificacion',
    })
    idTipoIdentificacion: number;
    
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
        () => User, 
        (user) => user.idTipoIdentificacion
    )
    usuarios: User[];
    
    @OneToMany(
        () => Personal, 
        (personal) => personal.idTipoIdentificacion
    )
    personal: Personal[];
    
    @OneToMany(
        () => Cliente, 
        (clientes) => clientes.idTipoIdentificacion
    )
    clientes: Cliente[];

}