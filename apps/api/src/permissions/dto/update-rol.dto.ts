import { PartialType } from "@nestjs/mapped-types";
import { CreateRoleDto } from "./create-rol.dto";
import { IsBoolean, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    
    @ApiProperty({ description: 'Identificador de si está activo', example: true, required:false})
    @IsOptional()
    @IsBoolean()
    estado?: boolean;

}