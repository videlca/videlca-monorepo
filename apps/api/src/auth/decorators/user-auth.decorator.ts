import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function UserAuth() {

  return applyDecorators(
    UseGuards(AuthGuard())
  );

}
