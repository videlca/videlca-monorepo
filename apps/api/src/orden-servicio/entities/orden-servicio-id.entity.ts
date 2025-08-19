import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
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
            nullable: true // Puede no tener orden asociada (cuando se anula)
        }
    )
    ordenServicio?: OrdenServicio;

}