import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

// UNA UNICA FILA VIGENTE CONTIENE EL RANGO DE HORAS DIURNO Y NOCTURNO (SON COMPLEMENTARIOS,
// EL NOCTURNO EMPIEZA EXACTAMENTE DONDE TERMINA EL DIURNO Y VICEVERSA, VER validarHorarios EN EL SERVICE)
@Entity({name: "tipo_horario"})
export class TipoHorario {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idTipoHorario',
    })
    idTipoHorario: number;

    @Column({
        type: 'varchar',
        length: 8,
        name: 'horaInicioDiurno',
        nullable: false
    })
    horaInicioDiurno: string; // Formato 'HH:mm:ss'

    @Column({
        type: 'varchar',
        length: 8,
        name: 'horaFinDiurno',
        nullable: false
    })
    horaFinDiurno: string; // Formato 'HH:mm:ss'

    @Column({
        type: 'varchar',
        length: 8,
        name: 'horaInicioNocturno',
        nullable: false
    })
    horaInicioNocturno: string; // Formato 'HH:mm:ss'

    @Column({
        type: 'varchar',
        length: 8,
        name: 'horaFinNocturno',
        nullable: false
    })
    horaFinNocturno: string; // Formato 'HH:mm:ss'

    @Column({
        type: 'date',
        name: 'fechaVigenciaInicio',
        nullable: false
    })
    fechaVigenciaInicio: Date;

    @Column({
        type: 'date',
        name: 'fechaVigenciaFin',
        nullable: true
    })
    fechaVigenciaFin: Date | null;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

}
