import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Adicional } from "./adicional.entity";

@Entity({ name: 'tipo_adicional' })
export class TipoAdicional {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoAdicional',
    })
    idTipoAdicional: number;

    // Codigo del tipo de adicional
    @Column({
        type: 'varchar',
        name: 'codigo',
        length: 10,
        unique: true
    })
    codigo: string;

    // Descripcion que se muestra donde se necesite el nombre del adicional (tablas, reportes, PDFs, liquidaciones)
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 150
    })
    descripcion: string;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @OneToMany(
        () => Adicional,
        (adicional) => adicional.idTipoAdicional
    )
    adicionales: Adicional[];

}
