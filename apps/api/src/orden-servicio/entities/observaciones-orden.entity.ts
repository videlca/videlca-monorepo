import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { OrdenServicio } from "./orden-servicio.entity";

@Entity({name: 'observacion_orden_servicio'})
export class ObservacionOrdenServicio {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idObservacionOrdenServicio'
    })
    idObservacionOrdenServicio: number;
    
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 255
    })
    descripcion: string;

    @ManyToOne(
        () => User,
        (user) => user.observacionesOrdenServicio,
        {
            onDelete: 'CASCADE',
            eager: true
        }
    )
    @JoinColumn({name: 'idUsuario'})
    idUsuario: User;
    
    @ManyToOne(
        () => OrdenServicio,
        (ordenServicio) => ordenServicio.observacionesOrdenServicio,
        {
            onDelete: 'CASCADE',
            eager: true
        }
    )
    @JoinColumn({name: 'idOrdenServicio'})
    idOrdenServicio: OrdenServicio;

}
