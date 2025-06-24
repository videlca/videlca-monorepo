import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';
import { User } from '../../users/entities/user.entity';

@Entity({name: "rol"})
export class Role {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idRol'
    })
    id: number;

    @Column({ unique: true })
    nombreRol: string;
    
    @Column({ 
        type: 'varchar',
        unique: true,
        name: 'descripcion' 
    })
    descripcion: string; // colocar nombre de una forma agradable a la vista

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    // Relación muchos a muchos con permisos
    @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
    @JoinTable({
    name: 'rol_permiso', // Nombre de la tabla que almacena la relación muchos-a-muchos
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    })
    permissions: Permission[];

    @OneToMany(
        () => User, 
        (user) => user.idRol
    )
    users: User[];
    
}