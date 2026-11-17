import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EstadoOrdenServicio } from "../../common/entities";
import { Locacion } from "./locacion.entity";
import { Cliente } from "./cliente.entity";


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

    // UN CONTACTO PERTENECE A UN PUESTO (ordenes asignadas a ese puesto) O A UN CLIENTE (ordenes asignadas directo
    // al cliente, sin puesto). Exactamente uno de los dos tiene valor
    @ManyToOne(
        () => Locacion,
        (locacion) => locacion.correos,
        {
            onDelete: 'CASCADE',
            eager: true,
            nullable: true
        }
    )
    @JoinColumn({name: 'idLocacion'})
    locacion: Locacion | null;

    @ManyToOne(
        () => Cliente,
        (cliente) => cliente.correos,
        {
            onDelete: 'CASCADE',
            nullable: true
        }
    )
    @JoinColumn({name: 'idCliente'})
    cliente: Cliente | null;

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