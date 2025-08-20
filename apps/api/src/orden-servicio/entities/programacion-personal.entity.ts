import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrdenServicioTarifa } from "./orden-servicio-tarifa.entity";
import { Personal } from "../../personal/entities";

@Entity({name: "programacion_personal"})
export class ProgramacionPersonal {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idProgramacionPersonal',
    })
    idProgramacionPersonal: number;

    @ManyToOne(
        () => OrdenServicioTarifa, 
        (ordenServicioTarifa) => ordenServicioTarifa.programaciones, 
        {
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({name: 'idOrdenServicioTarifa'})
    idOrdenServicioTarifa: OrdenServicioTarifa;

    @ManyToOne(
        () => Personal, 
        (personal) => personal.programaciones, 
        { eager: true }
    )
    @JoinColumn({name: 'idPersonal'})
    idPersonal: Personal;

    @Column({
            type: 'varchar',
            length: 8,
            name: 'horaInicio',
            nullable: false
    })
    horaInicio: string; // Formato 'HH:mm:ss'
    
    @Column({
        type: 'varchar',
        length: 8,
        name: 'horaFin',
        nullable: false
    })
    horaFin: string; // Formato 'HH:mm:ss'

}