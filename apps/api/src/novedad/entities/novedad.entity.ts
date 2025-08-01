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
        name: 'horaInicio',
        length: 8,
        nullable: false
    })
    horaInicio: string

    // FECHA HASTA / HORA HASTA
    @Column({
        type: 'date',
        name: 'fechaFin',
        nullable: true
    })
    fechaFin: Date | null;

    @Column({
        type: 'varchar',
        name: 'horaFin',
        length: 8,
        nullable: true
    })
    horaFin: string | null

    // ID PERSONAL
    @ManyToOne(
        () => Personal,
        (personal) => personal.novedades,
        {
            onDelete: 'CASCADE',
            eager: true
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