import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Departamento } from "./departamento.entity";

@Entity({ name: 'pais' })
export class Pais {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idPais',
    })
    idPais: number;
    
    @Column({
        type: 'varchar',
        length: 100,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;
    
    @OneToMany(() => Departamento, (departamento) => departamento.pais)
    departamentos: Departamento[];
}