import { PartialType } from "@nestjs/mapped-types";
import { CreateRoleDto } from "./create-rol.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    
    @IsOptional()
    @IsBoolean()
    estado?: boolean;

}