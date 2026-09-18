import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    IsNotEmpty,
    MaxLength,
    IsNumber,
    IsPositive,
    Min,
    IsDate,
    IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAdicionalDto {

    @ApiProperty({ description: 'Nombre del adicional', example: 'Adicional cambio de tarjeta', required: true })
    @IsString({ message: 'El campo nombre debe ser un string' })
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío' })
    @MaxLength(150, { message: 'El campo nombre no puede exceder los 150 caracteres' })
    nombre: string;

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

}
