import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CorreoDefault } from "../correo-default/correo-default.entity";

@Entity({name: "estado_app"})
export class EstadoApp {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idEstadoApp',
    })
    idEstadoApp: number;

    @Column({
        type: 'varchar',
        length: 100,
        name: 'nombre',
        unique: true,
        nullable: false
    })
    nombre: string;
    
    @Column({
        type: 'varchar',
        length: 255,
        name: 'descripcion',
        nullable: false
    })
    descripcion: string;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @ManyToMany(
        () => CorreoDefault, 
        (correoDefault) => correoDefault.estadosApp
    )
    correosDefault: CorreoDefault[];

}