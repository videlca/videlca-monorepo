import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrdenServicio } from "./orden-servicio.entity";

@Entity({name: "orden_servicio_id"})
export class OrdenServicioId {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idOrdenServicioId',
    })
    idOrdenServicioId: number;

    @Column({ 
        type: 'varchar',
        name: 'descripcionId', 
        length: 100, 
        unique: true // Para evitar duplicados
    })
    descripcionId: string;

    @Column({
        type: 'int',
        name: 'consecutivo',
        nullable: true,
        default: null
    })
    consecutivo: number;

    @BeforeInsert()
    @BeforeUpdate()
    updateConsecutivo() {
        if (this.descripcionId) {
             const match = this.descripcionId.match(/(\d+)\s*$/);
             this.consecutivo = match ? parseInt(match[1], 10) : 0;
        }
    }

    // FECHA CREACION
    @CreateDateColumn({
        type: 'datetime',
        name: 'fechaCreacion',
        nullable: false
    }) 
    fechaCreacion: Date; 

    @Column({ 
        type: 'boolean',
        name: 'anulado', 
        default: false
    })
    anulado: boolean;

    // Relación uno a cero-o-uno con OrdenServicio
    @OneToOne(
        () => OrdenServicio, 
        orden => orden.ordenServicioId, 
        {
            nullable: true,
        }
    )
    ordenServicio?: OrdenServicio;

}