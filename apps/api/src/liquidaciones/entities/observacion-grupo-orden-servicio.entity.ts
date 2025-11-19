import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { GrupoLiquidacion } from "./grupo_liquidaciones.entity";

@Entity({name: 'observacion_grupo_orden_servicio'})
export class ObservacionGrupoOrdenServicio {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idObservacionGrupoOrdenServicio'
    })
    idObservacionGrupoOrdenServicio: number;
    
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

    // FECHA CREACION
    @CreateDateColumn({
        type: 'datetime',
        name: 'fechaCreacion',
        nullable: false
    }) 
    fechaCreacion: Date;
    
    @ManyToOne(
        () => GrupoLiquidacion,
        (grupoOrdenServicio) => grupoOrdenServicio.observacionesGrupoOrdenServicio,
        {
            onDelete: 'CASCADE',
            eager: true
        }
    )
    @JoinColumn({name: 'idGrupoOrdenServicio'})
    idGrupoOrdenServicio: GrupoLiquidacion;

}
