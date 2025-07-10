import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Personal } from "../../personal/entities";
import { TipoNovedad } from "../entities";

@Entity({name: "novedad"})
export class Novedad {
    
    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idNovedad',
    })
    idNovedad: number;
    
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 500,
        nullable: true
    })
    descripcion: string;

    // FECHA DESDE / HORA DESDE
    @Column({
        type: 'date',
        name: 'fechaInicio'
    })
    fechaInicio: Date;

    @Column({
        type: 'varchar',
        name: 'horaInicio'
    })
    horaInicio: string

    // FECHA HASTA / HORA HASTA
    @Column({
        type: 'date',
        name: 'fechaFin',
        nullable: true
    })
    fechaFin: Date;

    @Column({
        type: 'varchar',
        name: 'horaFin',
        nullable: true
    })
    horaFin: string

    // ID PERSONAL
    @ManyToOne(
        () => Personal,
        (personal) => personal.idTipoPersonal,
        {
            eager: true,
            onDelete: 'CASCADE'
        }
    )
    @JoinColumn({name: 'idPersonal'})
    idPersonal: Personal;
    
    // ID TIPO NOVEDAD
    @ManyToOne(
        () => TipoNovedad,
        (tipoNovedad) => tipoNovedad.novedades,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoNovedad'})
    idTipoNovedad: TipoNovedad;

}