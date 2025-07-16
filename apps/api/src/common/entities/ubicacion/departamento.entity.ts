import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Pais } from "./pais.entity";
import { Ciudad } from "./ciudad.entity";

@Entity({ name: 'departamento' })
export class Departamento {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idDepartamento',
    })
    idDepartamento: number;
    
    @Column({
        type: 'varchar',
        length: 100,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;

    @Column({
        type: 'varchar',
        length: 45,
        name: 'codigoDepartamento',
        unique: true
    })
    codigoDepartamento: string;
    
    @ManyToOne(
        () => Pais, 
        (pais) => pais.departamentos, 
        { 
            onDelete: 'CASCADE',
            eager: true 
        }
    )
    @JoinColumn({name: 'idPais'})
    pais: Pais;

    @OneToMany(
        () => Ciudad, 
        (ciudad) => ciudad.departamento
    )
    ciudades: Ciudad[]

}