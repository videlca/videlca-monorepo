import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtValidateOnlyStrategy extends PassportStrategy(Strategy, 'jwt-validate-token') {

    constructor(
        private readonly configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get<string>('jwtSecret'),
            jwtFromRequest: ExtractJwt.fromExtractors([(req) => req.cookies[`${configService.get<string>('authToken')}`]]),
        });
    }

    async validate(payload: any): Promise<boolean> {
        // Simplemente valida el token y no devuelve datos en el request
        return true;
    }
}
