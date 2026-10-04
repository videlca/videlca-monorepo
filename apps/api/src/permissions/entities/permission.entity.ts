import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Role } from './role.entity';

@Entity({name: "permiso"})
export class Permission {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idPermiso'
    })
    id: number;

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

    // Relación muchos a muchos con roles
    @ManyToMany(() => Role, (role) => role.permissions)
    roles: Role[];

    @BeforeInsert()
    checkFieldsBeforeInsert(){
        this.descripcion = this.descripcion.toLowerCase().trim();
        this.nombre = this.nombre.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate(){
        this.checkFieldsBeforeInsert()
    }

}
