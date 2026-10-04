import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsPositive, Min, IsIn } from "class-validator";
import { PaginationOption } from "../interfaces/pagination.interface";
export class PaginationDto {
    
    @IsOptional()
    @IsNumber({}, {message: 'limit debe ser un número'})
    @IsPositive({message: 'limit debe ser un numero positivo'})
    @Min(1, {message: 'limit debe ser minimo 1'})
    @Type(() => Number)
    limit?: number;
    
    @IsOptional()
    @IsNumber({}, {message: 'offset debe ser un número'})
    @Min(0, {message: 'offset debe ser minimo 0'})
    @Type(() => Number)
    offset?: number;
    
    @IsOptional()
    @IsEnum(PaginationOption, {
      message: 'pagination debe ser "true" o "false"',
    })
    pagination?: PaginationOption;

}