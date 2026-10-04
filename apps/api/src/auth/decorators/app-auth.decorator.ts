import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UserPermissionsGuard } from '../guards';

import { ProtectedRoute } from './protected-route.decorator';

import { DescriptionRoutes } from '../interfaces';

export function AppAuth(routeDescription: DescriptionRoutes) {

  return applyDecorators(
    ProtectedRoute(routeDescription),
    UseGuards(AuthGuard(), UserPermissionsGuard)
  );

}
