import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'orden_servicio_id_anulado' })
export class OrdenServicioIdAnulado {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'id'
    })
    id: number;

    @Column({ 
        type: 'varchar',
        name: 'descripcionId', 
        length: 100, 
        unique: true // Para evitar duplicados
    })
    descripcionId: string;

    @Column({
        type: 'int',
        unique: true
    })
    consecutivo: number;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    motivo?: string;

    @CreateDateColumn({
        type: 'datetime',
        name: 'fechaCreacion',
        nullable: false
    })
    fechaCreacion: Date;
    
}