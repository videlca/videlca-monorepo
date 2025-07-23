import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Periodo } from "../../periodos/entities/periodo.entity";
import { Servicio } from "../../servicios/entities";
import { TipoTarifa } from "./tipo-tarifa.entity";

@Entity({name: 'tarifa'})
export class Tarifa {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTarifa',
    })
    idTarifa: number;
    
    // periodo -> relacion
    @ManyToOne(
        () => Periodo,
        (periodo) => periodo.tarifas,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idPeriodo'})
    idPeriodo: Periodo;
    
    // periodo -> relacion
    @ManyToOne(
        () => Servicio,
        (servicio) => servicio.tarifas,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idServicio'})
    idServicio: Servicio;
    
    // tipo tarifa -> relacion
    @ManyToOne(
        () => TipoTarifa,
        (tipoTarifa) => tipoTarifa.tarifas,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTipoTarifa'})
    idTipoTarifa: TipoTarifa;

    // PRECIO SIN IVA

    // IVA

    // PRECIO TOTAL CON IVA

    // ESTADO

    // FECHA ASIGNACION

    // FECHA ACTUALIZACION

}
