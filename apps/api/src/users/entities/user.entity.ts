import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from "typeorm";
import { TipoIdentificacion } from "../../common/entities";
import { Role } from "../../permissions/entities";

@Entity({name: 'usuario'})
export class User {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idUsuario',
    })
    idUser: number;
    
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
    
    @Column({
        type: 'varchar',
        name: 'email',
        length: 100,
        unique: true 
    })
    email: string;

    @Column({
        type: 'varchar',
        name: 'clave',
        length: 250,
        select: false, 
    })
    clave: string;
    
    @Column({
        type: 'varchar',
        name: 'numeroIdentificacion',
        length: 50,
        unique: true 
    })
    numeroIdentificacion: string;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @ManyToOne(
        () => TipoIdentificacion,
        (tipoIdentificacion) => tipoIdentificacion.usuarios,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoIdentificacion'})
    idTipoIdentificacion: TipoIdentificacion;
    
    @ManyToOne(
        () => Role,
        (role) => role.users,
        {eager: true}
    )
    @JoinColumn({name: 'idRol'})
    idRol: Role;

    @BeforeInsert()
    checkFieldsBeforeInsert(){
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate(){
        this.email = this.email.toLowerCase().trim();
    }
}
