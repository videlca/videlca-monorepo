import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Cliente } from "../../../clientes/entities";

@Entity({name: "tipo_cliente"})
export class TipoCliente {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoCliente',
    })
    idTipoCliente: number;
    
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
        () => Cliente, 
        (clientes) => clientes.idTipoCliente
    )
    clientes: Cliente[];

}