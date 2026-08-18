import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TarifaHora } from "./tarifa-hora.entity";

@Entity({name: "tarifa_hora_descripcion"})
export class TarifaHoraDescripcion {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTarifaHoraDescripcion',
    })
    idTarifaHoraDescripcion: number;

    // nombre
    // length 50: "valor hora diurna dominical y festivos" (TipoHoraDescripcionInterface) ya son 38 caracteres
    @Column({
        type: 'varchar',
        name: 'nombre',
        length: 50,
        unique: true
    })
    nombre: string;
    
    // descripcion
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 255
    })
    descripcion: string;

    // identificar si es tarifa de hora normal o tarifa de hora dominical
    @Column({
        type: 'boolean',
        name: 'dominical',
        default: false
    })
    dominical: boolean;

    // identificar si es tarifa de hora normal o tarifa de hora nocturna
    @Column({
        type: 'boolean',
        name: 'diurno',
        default: true
    })
    diurno: boolean;

    // relacion con tarifa hora
    @OneToMany(
        () => TarifaHora, 
        (tarifaHora) => tarifaHora.idTarifaHoraDescripcion, 
    )
    tarifasHoras: TarifaHora[];

}