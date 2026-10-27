import { ApiProperty } from "@nestjs/swagger";
import {
    IsNumber,
    IsPositive,
    Min,
    IsDate,
    IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAdicionalDto {

    @ApiProperty({ description: 'Id del tipo de adicional', example: 1, required: true })
    @IsNumber({}, { message: 'El valor del campo tipo de adicional debe ser un número' })
    @IsPositive({ message: 'El valor del campo tipo de adicional debe ser un numero positivo' })
    @Min(1, { message: 'El valor del campo tipo de adicional debe ser minimo 1' })
    idTipoAdicional: number;

    @ApiProperty({ description: 'Id del cliente al que se le cobra el adicional', example: 1, required: true })
    @IsNumber({}, { message: 'El valor del campo cliente debe ser un número' })
    @IsPositive({ message: 'El valor del campo cliente debe ser un numero positivo' })
    @Min(1, { message: 'El valor del campo cliente debe ser minimo 1' })
    idCliente: number;

    // SE NORMALIZA AL DIA 1 DEL MES AL GUARDAR, SIN IMPORTAR QUE DIA SE ENVIE
    @ApiProperty({ description: 'Mes desde el que empieza a cobrar el adicional', example: 'ISO String 2024-09-01T00:00:00.000Z', required: true })
    @Transform(({ value }) => new Date(value))
    @IsDate()
    mesInicio: Date;

    // NULL/NO ENVIADO = INDEFINIDO (sigue cobrando cada mes). CON VALOR = COBRA HASTA ESE MES INCLUSIVE (si es igual a
    // mesInicio, solo cobra ese unico mes)
    @ApiProperty({ description: 'Mes hasta el que cobra el adicional, inclusive. No enviar (o null) si es indefinido', example: 'ISO String 2024-09-01T00:00:00.000Z', required: false })
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    mesFin?: Date | null;

    @ApiProperty({ description: 'Costos directos del adicional', example: 100000, required: false })
    @IsOptional()
    @IsNumber({}, { message: 'El valor del campo costos directos debe ser un número' })
    @Min(0, { message: 'El valor del campo costos directos debe ser mayor o igual a 0' })
    costosDirectos?: number;

    @ApiProperty({ description: 'Seguro de vida del adicional', example: 0, required: false })
    @IsOptional()
    @IsNumber({}, { message: 'El valor del campo seguro de vida debe ser un número' })
    @Min(0, { message: 'El valor del campo seguro de vida debe ser mayor o igual a 0' })
    seguroVida?: number;

    @ApiProperty({ description: 'AUI del adicional', example: 0, required: false })
    @IsOptional()
    @IsNumber({}, { message: 'El valor del campo aui debe ser un número' })
    @Min(0, { message: 'El valor del campo aui debe ser mayor o igual a 0' })
    aui?: number;

    // Los siguientes 4 campos se calculan automaticamente (ver AdicionalesService.calcularTotales) si no se envian.
    // Se exponen como opcionales para permitir control manual, decimal a decimal, sobre el desglose de precio
    // (por ejemplo, para hacer coincidir el valor exacto de una factura externa en vez del redondeo hacia arriba)
    @ApiProperty({ description: 'Costos directos + seguro de vida. Se calcula automáticamente si no se envía', example: 100000, required: false })
    @IsOptional()
    @IsNumber({}, { message: 'El valor del campo costos directos + seguro de vida debe ser un número' })
    @Min(0, { message: 'El valor del campo costos directos + seguro de vida debe ser mayor o igual a 0' })
    costosDirectosSeguroVida?: number;

    @ApiProperty({ description: 'Precio antes de IVA. Se calcula automáticamente si no se envía', example: 100000, required: false })
    @IsOptional()
    @IsNumber({}, { message: 'El valor del campo precio antes de IVA debe ser un número' })
    @Min(0, { message: 'El valor del campo precio antes de IVA debe ser mayor o igual a 0' })
    precioAntesIva?: number;

    @ApiProperty({ description: 'IVA. Se calcula automáticamente si no se envía', example: 1900, required: false })
    @IsOptional()
    @IsNumber({}, { message: 'El valor del campo IVA debe ser un número' })
    @Min(0, { message: 'El valor del campo IVA debe ser mayor o igual a 0' })
    iva?: number;

    @ApiProperty({ description: 'Precio total con IVA, valor que se cobra cada mes. Se calcula automáticamente si no se envía', example: 101900, required: false })
    @IsOptional()
    @IsNumber({}, { message: 'El valor del campo precio total debe ser un número' })
    @Min(0, { message: 'El valor del campo precio total debe ser mayor o igual a 0' })
    precioTotal?: number;

}
