import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Role } from './role.entity';

@Entity({name: "permiso"})
export class Permission {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idPermiso'
    })
    id: number;
    
    @Column({ type: 'varchar' })
    ruta: string; // Ruta o acción a la que da acceso

    @Column({
        type: 'varchar',
        unique: true,
        name: 'descripcion'
    })
    descripcion: string; // Descripción de la ruta

    @Column({
        type: 'varchar',
        unique: true
    })
    nombre: string; // nombre que se mostrara en el frontend

    @Column({
        type: 'varchar',
    })
    modulo: string;

    @Column({
        type: 'boolean',
        default: true,
        name: 'estado'
    })
    activo: boolean;

    @Column({
        type: 'boolean',
        default: true
    })
    modificar: boolean;

    // Relación muchos a muchos con roles
    @ManyToMany(() => Role, (role) => role.permissions)
    roles: Role[];

    @BeforeInsert()
    checkFieldsBeforeInsert(){
        this.descripcion = this.descripcion.toLowerCase().trim();
        this.nombre = this.nombre.toLowerCase().trim();
        this.modulo = this.modulo.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate(){
        this.checkFieldsBeforeInsert()
    }

}
