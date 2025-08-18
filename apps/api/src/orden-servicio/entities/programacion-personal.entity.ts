import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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

}