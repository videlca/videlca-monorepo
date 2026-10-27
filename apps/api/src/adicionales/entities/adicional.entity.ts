import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Cliente } from "../../clientes/entities";
import { Ciudad } from "../../common/entities";
import { User } from "../../users/entities/user.entity";
import { Liquidacione } from "../../liquidaciones/entities/liquidacione.entity";
import { TipoAdicional } from "./tipo-adicional.entity";

@Entity({ name: 'adicional' })
export class Adicional {

    @PrimaryGeneratedColumn({
        type: 'int',
        name: 'idAdicional',
    })
    idAdicional: number;

    // TIPO DE ADICIONAL -> relacion. Su descripcion es lo que se muestra como nombre del adicional
    @ManyToOne(
        () => TipoAdicional,
        (tipoAdicional) => tipoAdicional.adicionales,
        { eager: true, nullable: false }
    )
    @JoinColumn({ name: 'idTipoAdicional' })
    idTipoAdicional: TipoAdicional;

    // Cliente al que se le cobra el adicional -> relacion
    @ManyToOne(
        () => Cliente,
        (cliente) => cliente.adicionales,
        { eager: true }
    )
    @JoinColumn({ name: 'idCliente' })
    idCliente: Cliente;

    // Ciudad del adicional -> relacion. De ella sale el centro de costos de la interfase. Obligatoria al crear; en BD
    // es nullable solo por los adicionales creados antes de existir esta columna
    @ManyToOne(
        () => Ciudad,
        { eager: true, nullable: true }
    )
    @JoinColumn({ name: 'idCiudad' })
    idCiudad: Ciudad | null;

    // Usuario que creo el adicional -> relacion
    @ManyToOne(
        () => User,
        (usuario) => usuario.adicionales,
        { eager: true }
    )
    @JoinColumn({ name: 'idUsuarioCreacion' })
    idUsuarioCreacion: User;

    // MES DESDE EL QUE EMPIEZA A COBRAR (siempre normalizado al dia 1 del mes)
    @Column({
        type: 'date',
        name: 'mesInicio',
        nullable: false
    })
    mesInicio: Date;

    // MES HASTA EL QUE COBRA, INCLUSIVE (siempre normalizado al dia 1 del mes). NULL = INDEFINIDO (sigue cobrando cada mes)
    @Column({
        type: 'date',
        name: 'mesFin',
        nullable: true
    })
    mesFin: Date | null;

    // COSTOS DIRECTOS
    @Column({
        type: 'decimal',
        name: 'costosDirectos',
        precision: 20,
        scale: 2,
        default: 0
    })
    costosDirectos: number;

    // SEGURO VIDA
    @Column({
        type: 'decimal',
        name: 'seguroVida',
        precision: 20,
        scale: 2,
        default: 0
    })
    seguroVida: number;

    // AUI
    @Column({
        type: 'decimal',
        name: 'aui',
        precision: 20,
        scale: 2,
        default: 0
    })
    aui: number;

    // COSTOS DIRECTOS + SEGURO VIDA (calculado)
    @Column({
        type: 'decimal',
        name: 'costosDirectosSeguroVida',
        precision: 20,
        scale: 2
    })
    costosDirectosSeguroVida: number;

    // PRECIO ANTES DE IVA (calculado)
    @Column({
        type: 'decimal',
        name: 'precioAntesIva',
        precision: 20,
        scale: 2
    })
    precioAntesIva: number;

    // IVA (calculado)
    @Column({
        type: 'decimal',
        name: 'iva',
        precision: 20,
        scale: 2
    })
    iva: number;

    // PRECIO TOTAL CON IVA (calculado). ESTE ES EL VALOR QUE SE COBRA CADA MES QUE EL ADICIONAL ESTE VIGENTE
    @Column({
        type: 'decimal',
        name: 'precioTotal',
        precision: 20,
        scale: 2
    })
    precioTotal: number;

    // ESTADO -> false = cancelado (deja de cobrarse desde el momento en que se cancela, sin importar mesFin)
    @Column({
        type: 'boolean',
        name: 'estado',
        default: true
    })
    estado: boolean;

    @CreateDateColumn({
        name: 'fechaCreacion',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        precision: 0,
    })
    fechaCreacion: Date;

    @OneToMany(
        () => Liquidacione,
        (liquidacion) => liquidacion.adicional
    )
    liquidaciones: Liquidacione[];

}
