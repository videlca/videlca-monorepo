import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Departamento } from './departamento.entity';
import { Personal } from "../../../personal/entities";
import { Locacion } from "../../../clientes/entities";

@Entity({ name: 'ciudad' })
export class Ciudad {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idCiudad',
    })
    idCiudad: number;
    
    @Column({
        type: 'varchar',
        length: 45,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;
    
    @Column({
        type: 'varchar',
        length: 45,
        name: 'codigoCiudad',
        unique: false
    })
    codigoCiudad: string;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;
    
    @ManyToOne(
        () => Departamento, 
        (departamento) => departamento.ciudades, 
        { 
            onDelete: 'CASCADE',
            eager: true 
        }
    )
    @JoinColumn({name: 'idDepartamento'})
    departamento: Departamento;

    @OneToMany(
        () => Personal, 
        (personal) => personal.idCiudad
    )
    personal: Personal[];
    
    @OneToMany(
        () => Locacion, 
        (locacion) => locacion.idCiudad
    )
    locaciones: Locacion[];

}