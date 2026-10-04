import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function ValidateJwtAuth() {

  return applyDecorators(
    UseGuards(AuthGuard('jwt-validate-token'))
  );

}
