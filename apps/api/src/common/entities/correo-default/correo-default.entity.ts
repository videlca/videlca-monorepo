import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EstadoOrdenServicio } from "../estado-orden-servicio/estado-orden-servicio.entity";
import { EstadoApp } from "../estado-app/estado-app.entity";


@Entity({name: 'correo_default'})
export class CorreoDefault {
    
     @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idCorreoDefault',
    })
    idCorreoDefault: number;

    // descripcion
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 50,
        nullable: false
    })
    descripcion: string;

    // email
    @Column({
        type: 'varchar',
        name: 'email',
        length: 100,
        nullable: false
    })
    email: string;

    // Relación muchos a muchos con estados ordenes de servicio
    @ManyToMany(
        () => EstadoOrdenServicio, 
        (estadoOrden) => estadoOrden.correosDefault, 
        { cascade: true }
    )
    @JoinTable({
        name: 'correo_default_estado_orden', // Nombre de la tabla que almacena la relación muchos-a-muchos
        joinColumn: { name: 'correo_default_id', referencedColumnName: 'idCorreoDefault' },
        inverseJoinColumn: { name: 'estado_id', referencedColumnName: 'idEstadoOrdenServicio' },
    })
    estados: EstadoOrdenServicio[];
    
    // Relación muchos a muchos con estados de la app
    @ManyToMany(
        () => EstadoApp, 
        (estadoApp) => estadoApp.correosDefault, 
        { cascade: true }
    )
    @JoinTable({
        name: 'correo_default_estado_app', // Nombre de la tabla que almacena la relación muchos-a-muchos
        joinColumn: { name: 'correo_default_id', referencedColumnName: 'idCorreoDefault' },
        inverseJoinColumn: { name: 'estado_app_id', referencedColumnName: 'idEstadoApp' },
    })
    estadosApp: EstadoApp[];

}