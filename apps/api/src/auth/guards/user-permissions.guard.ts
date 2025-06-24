import { Reflector } from '@nestjs/core';
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

import { User } from '../../users/entities/user.entity';
import { META_ROUTES } from '../decorators/protected-route.decorator';
import { Roles } from '../interfaces';

@Injectable()
export class UserPermissionsGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector,
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const req = context.switchToHttp().getRequest();

    const user = req.user.user as User;

    if(!user)
      throw new BadRequestException('User not found');

    if(user.idRol.nombreRol == Roles.SUPER_ADMIN) return true;
  
    const permisos: string[] = req.user.permisos;

    if(!permisos.length) throw new ForbiddenException("User no tiene permisos requeridos para ingresar a este recurso"); 

    const handlerRoute = this.reflector.get<string>(META_ROUTES, context.getHandler());

    // Obtener metadata del controller
    const controllerRoute = this.reflector.get<string>(META_ROUTES,context.getClass());

    // Usar el metadata del handler si existe, si no, usar el del controller
    const protectedRoute = handlerRoute || controllerRoute;

    if(!protectedRoute) throw new ForbiddenException('No se encuentra el recurso al que se quiere acceder');
    
    if(permisos.includes(protectedRoute)){
      return true;
    }

    throw new ForbiddenException(
      `User ${user.primerNombre} ${user.primerApellido} no tiene permisos requeridos para ingresar a este recurso`
    );

  }
}
