import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAdicionalDto } from './create-adicional.dto';

// EL CLIENTE NO SE PUEDE CAMBIAR UNA VEZ CREADO EL ADICIONAL (si se cobro a un cliente equivocado, se cancela y se crea uno nuevo)
export class UpdateAdicionalDto extends PartialType(
    OmitType(CreateAdicionalDto, ['idCliente'])
) {

    @ApiProperty({ description: 'Estado del adicional (false = cancelado, deja de cobrarse desde ya)', example: true, required: false })
    @IsOptional()
    @IsBoolean({ message: 'El campo estado debe ser boolean' })
    estado?: boolean;

}
