import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { TipoIdentificacion, Ciudad } from "../../common/entities";
import { Novedad } from "../../novedad/entities";
import { ProgramacionPersonal } from "../../orden-servicio/entities/programacion-personal.entity";
import { TipoPersonal, TipoGenero, TipoContrato } from "../entities";

@Entity({name: 'personal'})
export class Personal {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idPersonal',
    })
    idPersonal: number;
    
    // Nombre completo
    @Column({
        type: 'varchar',
        name: 'primerNombre',
        length: 50 
    })
    primerNombre: string;
    
    @Column({
        type: 'varchar',
        name: 'segundoNombre',
        length: 50,
        nullable: true 
    })
    segundoNombre: string;
    
    @Column({
        type: 'varchar',
        name: 'primerApellido',
        length: 50 
    })
    primerApellido: string;
    
    @Column({
        type: 'varchar',
        name: 'segundoApellido',
        length: 50,
        nullable: true 
    })
    segundoApellido: string;

    // numero y tipo id
    @Column({
        type: 'varchar',
        name: 'numeroIdentificacion',
        length: 50,
        unique: true 
    })
    numeroIdentificacion: string;

    @ManyToOne(
        () => TipoIdentificacion,
        (tipoIdentificacion) => tipoIdentificacion.personal,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoIdentificacion'})
    idTipoIdentificacion: TipoIdentificacion;

    // fecha inicio contrato
    @Column({ 
        type: 'date',
        name: 'fechaInicioContrato' 
    })
    fechaInicioContrato: Date;

    // fecha fin de contrato
    @Column({ 
        type: 'date',
        name: 'fechaFinContrato',
        nullable: true
    })
    fechaFinContrato: Date;

    // fecha de nacimiento
    @Column({ 
        type: 'date',
        name: 'fechaNacimiento' 
    })
    fechaNacimiento: Date;
    
    // direccion
    @Column({
        type: 'varchar',
        name: 'direccionResidencia',
    })
    direccionResidencia: string;
    
    // telefono
    @Column({
        type: 'varchar',
        name: 'telefono',
        length: 10,
    })
    telefono: string;
    
    // check con armas
    @Column({
        type: 'boolean',
        name: 'arma',
        default: true
    })
    arma: boolean;

    // ciudad -> relacion tabla menor
    @ManyToOne(
        () => Ciudad,
        (ciudad) => ciudad.personal,
        {eager: true}
    )
    @JoinColumn({name: 'idCiudad'})
    idCiudad: Ciudad;

    // sexo -> relacion tabla menor (listo)
    @ManyToOne(
        () => TipoGenero,
        (tipoGenero) => tipoGenero.personal,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoGenero'})
    idTipoGenero: TipoGenero;

    // Tipo personal -> relacion tabla menor (listo)
    @ManyToOne(
        () => TipoPersonal,
        (tipoPersonal) => tipoPersonal.personal,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoPersonal'})
    idTipoPersonal: TipoPersonal;
    
    // Tipo contrato -> relacion tabla menor (listo)
    @ManyToOne(
        () => TipoContrato,
        (tipoContrato) => tipoContrato.personal,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoContrato'})
    idTipoContrato: TipoContrato;

    // estado -> para ver si el user esta activo o no
    @Column({
        type: 'boolean',
        name: 'laborando',
        default: true
    })
    laborando: boolean;

    // novedades -> relacion tabla novedades ()
    @OneToMany(
        () => Novedad, 
        (novedad) => novedad.idPersonal,
        {
            cascade: true
        }
    )
    novedades: Novedad[];

    // programacion - asignaciones -> relacion tabla para programar personal ()
    @OneToMany(
        () => ProgramacionPersonal, 
        (programacion) => programacion.idPersonal, 
        {
            cascade: true,
        }
    )
    programaciones: ProgramacionPersonal[];

}
