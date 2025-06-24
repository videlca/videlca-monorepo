import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EstadoOrdenServicio } from "../../common/entities";
import { Locacion } from "./locacion.entity";


@Entity({name: 'correo'})
export class Correo {
    
     @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idCorreo',
    })
    idCorreo: number;

    // nombre - apellido
    @Column({
        type: 'varchar',
        name: 'nombre',
        length: 50 
    })
    nombre: string;
    
    @Column({
        type: 'varchar',
        name: 'apellido',
        length: 50 
    })
    apellido: string;

    // email
    @Column({
        type: 'varchar',
        name: 'email',
        length: 100,
    })
    email: string;

    @ManyToOne(
        () => Locacion,
        (locacion) => locacion.correos,
        {
            onDelete: 'CASCADE',
            eager: true
        }
    )
    @JoinColumn({name: 'idLocacion'})
    locacion: Locacion;

    // Relación muchos a muchos con estados ordenes de servicio
    @ManyToMany(
        () => EstadoOrdenServicio, 
        (estadoOrden) => estadoOrden.correos, 
        { cascade: true }
    )
    @JoinTable({
        name: 'correo_estado', // Nombre de la tabla que almacena la relación muchos-a-muchos
        joinColumn: { name: 'correo_id', referencedColumnName: 'idCorreo' },
        inverseJoinColumn: { name: 'estado_id', referencedColumnName: 'idEstadoOrdenServicio' },
    })
    estados: EstadoOrdenServicio[];

}