import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { TipoIdentificacion, TipoCliente } from "../../common/entities";
import { SubSegmentacion, Locacion } from ".";
import { NumeroPedido } from "../../liquidaciones/entities";
import { OrdenServicio } from "../../orden-servicio/entities/orden-servicio.entity";
import { Adicional } from "../../adicionales/entities/adicional.entity";

@Entity({name: 'cliente'})
export class Cliente {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idCliente',
    })
    idCliente: number;

    // numero y tipo id
    @Column({
        type: 'varchar',
        name: 'numeroIdentificacion',
        length: 50,
        unique: true 
    })
    numeroIdentificacion: string;    

    // tipo id -> relacion
    @ManyToOne(
        () => TipoIdentificacion,
        (tipoIdentificacion) => tipoIdentificacion.clientes,
        {eager: true}
    )
    @JoinColumn({name: 'idTipoIdentificacion'})
    idTipoIdentificacion: TipoIdentificacion;

    // nombre
    @Column({
        type: 'varchar',
        name: 'nombre',
        length: 100 
    })
    nombre: string;
    
    // estado
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    // tipo cliente -> relacion
    @ManyToOne(
        () => TipoCliente,
        (tipoCliente) => tipoCliente.clientes,
        {
            eager: true
        }
    )
    @JoinColumn({name: 'idTipoCliente'})
    idTipoCliente: TipoCliente;

    // sub-segmentacion -> relacion
    @ManyToOne(
        () => SubSegmentacion,
        (subSegmentacion) => subSegmentacion.clientes,
        {
            eager: true,
            nullable: true
        }
    )
    @JoinColumn({name: 'idSubSegmentacion'})
    idSubSegmentacion: SubSegmentacion;
    
    // puestos -> relacion
    @OneToMany(
        () => Locacion,
        (locacion) => locacion.idCliente,
        { 
            cascade: true, 
        }
    )
    locaciones: Locacion[];
    
    // numeros pedido -> relacion
    @OneToMany(
        () => NumeroPedido,
        (numeroPedido) => numeroPedido.idCliente,
        {
            cascade: true,
        }
    )
    numerosPedido: NumeroPedido[];

    // ordenes de servicio asignadas directamente a este cliente (servicios de tipo "Monitoreo de alarmas") -> relacion
    @OneToMany(
        () => OrdenServicio,
        (ordenServicio) => ordenServicio.idCliente
    )
    ordenesServicio: OrdenServicio[];

    // adicionales cobrados a este cliente -> relacion
    @OneToMany(
        () => Adicional,
        (adicional) => adicional.idCliente
    )
    adicionales: Adicional[];

}
