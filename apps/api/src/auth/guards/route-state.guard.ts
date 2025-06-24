import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PermissionsService } from '../../permissions/permissions.service';
import { META_ROUTES } from '../decorators/protected-route.decorator';


@Injectable()
export class RouteStateGuard implements CanActivate {

  constructor(
    // @Inject(PermissionsService)
    private readonly permissionsService: PermissionsService,
    private readonly reflector: Reflector,
  ){}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const handlerRoute = this.reflector.get<string>(META_ROUTES, context.getHandler());

    // Obtener metadata del controller
    const controllerRoute = this.reflector.get<string>(META_ROUTES,context.getClass());

    // Usar el metadata del handler si existe, si no, usar el del controller
    const protectedRoute = handlerRoute || controllerRoute;

    if(!protectedRoute) throw new ForbiddenException('No se encuentra el recurso al que se quiere acceder');

    const permission = await this.permissionsService.findOnePermissionByDescripton(protectedRoute);
    
    if(!permission) throw new NotFoundException(`la Ruta a la que quieres acceder no se encuentra`);

    if(!permission.activo) throw new ForbiddenException(`La ruta solicitada esta deshabilitada`);

    return true;

  }


}
