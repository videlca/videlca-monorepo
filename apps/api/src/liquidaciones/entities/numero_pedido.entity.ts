import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cliente } from "../../clientes/entities";
import { GrupoLiquidacion } from "../../liquidaciones/entities/grupo_liquidaciones.entity";

@Entity({name: 'numero_pedido'})
export class NumeroPedido {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idNumeroPedido',
    })
    idNumeroPedido: number;   

    // cliente -> relacion
    @ManyToOne(
        () => Cliente,
        (cliente) => cliente.numerosPedido,
        {eager: true}
    )
    @JoinColumn({name: 'idCliente'})
    idCliente: Cliente;
    
    // grupo liquidacion -> relacion
    @ManyToOne(
        () => GrupoLiquidacion,
        (grupoLiquidacion) => grupoLiquidacion.numerosPedido,
        {eager: true}
    )
    @JoinColumn({name: 'idGrupoLiquidacion'})
    idGrupoLiquidacion: GrupoLiquidacion;


}
