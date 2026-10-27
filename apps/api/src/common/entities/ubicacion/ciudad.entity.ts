import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Departamento } from './departamento.entity';
import { Personal } from "../../../personal/entities";
import { Locacion } from "../../../clientes/entities";

@Entity({ name: 'ciudad' })
export class Ciudad {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idCiudad',
    })
    idCiudad: number;
    
    @Column({
        type: 'varchar',
        length: 45,
        name: 'descripcion',
        unique: true
    })
    descripcion: string;
    
    @Column({
        type: 'varchar',
        length: 5,
        name: 'codigoCiudad',
        unique: false
    })
    codigoCiudad: string;

    // CENTRO DE COSTOS SIIGO de las ordenes de vigilancia y adicionales de esta ciudad (columna CENTRO DE COSTO de la
    // interfase). Las ordenes de monitoreo de alarmas no lo usan: van siempre al centro de costos fijo de monitoreo
    @Column({
        type: 'int',
        name: 'centro_costos',
        nullable: true
    })
    centroCostos: number | null;

    // SUBCENTRO DE COSTOS SIIGO (columna SUBCENTRO DE COSTO de la interfase)
    @Column({
        type: 'int',
        name: 'sub_centro_costos',
        nullable: true
    })
    subCentroCostos: number | null;

    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;
    
    @ManyToOne(
        () => Departamento, 
        (departamento) => departamento.ciudades, 
        { 
            onDelete: 'CASCADE',
            eager: true 
        }
    )
    @JoinColumn({name: 'idDepartamento'})
    departamento: Departamento;

    @OneToMany(
        () => Personal, 
        (personal) => personal.idCiudad
    )
    personal: Personal[];
    
    @OneToMany(
        () => Locacion, 
        (locacion) => locacion.idCiudad
    )
    locaciones: Locacion[];

}