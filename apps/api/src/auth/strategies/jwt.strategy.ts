import { Injectable, UnauthorizedException, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { UsersService } from "../../users/users.service";
import { User } from "../../users/entities/user.entity";

import { PermissionsService } from "../../permissions/permissions.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly permissionsService: PermissionsService,
        private readonly configService: ConfigService
    ){
        super({
            secretOrKey: configService.get<string>('jwtSecret'),
            jwtFromRequest: ExtractJwt.fromExtractors([(req) => req.cookies[`${configService.get<string>('authToken')}`]]), // Extrae el token de la cookie
        });
    }


    async validate(payload: JwtPayload): Promise<{user: User; permisos: string[];}>{

        const { id } = payload;

        const user = await this.usersService.findOne(id);

        if(!user)
            throw new UnauthorizedException('Token not valid');
        
        if(!user.estado)
            throw new UnauthorizedException('User no esta activo');

        const role = await this.permissionsService.findOneRole(user.idRol.id);

        const permisos = role.permissions.map(permiso => permiso.descripcion)
    
        return {
            user,
            permisos
        };

    }

}