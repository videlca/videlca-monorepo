import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

// TABLA DE PARAMETROS PARA LOS VALORES DE OrigenServicioEnum (../interfaces/origen-servicio.interface.ts).
// ESTA TABLA SOLO SE AJUSTA DESDE EL BACKEND (los datos se cargan directamente en la BD), por eso el
// service/controller de esta entidad unicamente exponen una ruta de visualizacion (findAll)
@Entity({name: "origen_servicio"})
export class OrigenServicio {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idOrigenServicio',
    })
    idOrigenServicio: number;

    // nombre -> para mostrar en el front
    @Column({
        type: 'varchar',
        name: 'nombre',
        length: 100
    })
    nombre: string;

    // descripcion -> para mostrar en el front
    @Column({
        type: 'varchar',
        name: 'descripcion',
        length: 255
    })
    descripcion: string;

    // code -> valor de OrigenServicioEnum ("catalogo", "a_medida")
    @Column({
        type: 'varchar',
        name: 'code',
        length: 30,
        unique: true
    })
    code: string;

}
