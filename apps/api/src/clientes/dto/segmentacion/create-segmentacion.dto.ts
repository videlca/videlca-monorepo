import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateTipoDto } from "../../../common/dto";

export class CreateSegmentacionDto {

    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcion: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTipoDto)
    subSegmentaciones?: CreateTipoDto[];

}