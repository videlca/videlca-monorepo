import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Ciudad } from "../../common/entities";
import { Correo } from "./correo.entity";
import { Cliente } from "./cliente.entity";
import { OrdenServicio } from "../../orden-servicio/entities/orden-servicio.entity";

@Entity({name: 'locacion'})
export class Locacion {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idLocacion',
    })
    idLocacion: number;
    
    // NOMBRE
    @Column({
        type: 'varchar',
        name: 'nombre',
        length: 100 
    })
    nombre: string;

    // CIUDAD -> RELACION (YA CON ESTO TENEMOS EL DPTO)
    @ManyToOne(
        () => Ciudad,
        (ciudad) => ciudad.locaciones,
        {eager: true}
    )
    @JoinColumn({name: 'idCiudad'})
    idCiudad: Ciudad;

    // DIRECCION
    @Column({
        type: 'varchar',
        name: 'direccion',
        length: 100
    })
    direccion: string;

    // LONGITUD & LATITUD
    @Column({
        type: 'varchar',
        name: 'latitud',
        length: 10 
    })
    latitud: string;

    @Column({
        type: 'varchar',
        name: 'longitud',
        length: 10 
    })
    longitud: string;

    // NOMBRE RESPONSABLE
    @Column({
        type: 'varchar',
        name: 'primerNombreResponsable',
        length: 50 
    })
    primerNombreResponsable: string;
    
    @Column({
        type: 'varchar',
        name: 'primerApellidoResponsable',
        length: 50 
    })
    primerApellidoResponsable: string;

    // TELEFONO 1
    @Column({
        type: 'varchar',
        name: 'telefono',
        length: 10,
    })
    telefono: string;

    // TELEFONO 2 -> NULL
    @Column({
        type: 'varchar',
        name: 'segundoTelefono',
        length: 10,
        nullable: true
    })
    segundoTelefono: string;

    // DIAS DE ANTICIPACION PARA NOTIFICAR CAMBIOS
    @Column({
        type: 'int',
        name: 'diasAnticipaticionNotificacion',
        nullable: false,
        default: 0
    })
    diasAnticipaticionNotificacion: number;

    // CORREOS -> RELACION
    @OneToMany(
        () => Correo,
        (correo) => correo.locacion,
        { 
            cascade: true, 
        }
    )
    correos: Correo[];

    // Cliente -> relacion
    @ManyToOne(
        () => Cliente,
        (cliente) => cliente.locaciones,
        {
            onDelete: 'CASCADE',
            eager: true
        }
    )
    @JoinColumn({name: 'idCliente'})
    idCliente: Cliente;

    // Cliente responsable de facturacion
    @ManyToOne(
        () => Cliente,
        {
            nullable: true,
            eager: true,
            onDelete: 'SET NULL'
        }
    )
    @JoinColumn({ name: 'idClienteFacturacion' })
    idClienteFacturacion: Cliente;

    // estado -> bool
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @OneToMany(
        () => OrdenServicio,
        (ordenServicio) => ordenServicio.idLocacion
    )
    ordenesServicio: OrdenServicio[];

}