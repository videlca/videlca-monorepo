import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateTipoDto } from "../../../common/dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSegmentacionDto {

    @ApiProperty({ description: 'Descripción de la egmentación', example: 'Descripción de la segmentación', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcion: string;

    @ApiProperty({ description: 'Subsegmentaciones.', example: [ { 
        descripción: "Descripción1"
     } ], required:false})
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTipoDto)
    subSegmentaciones?: CreateTipoDto[];

}