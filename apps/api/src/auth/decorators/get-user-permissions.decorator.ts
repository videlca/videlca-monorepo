import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

export const GetUserPermissions = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        
        const req = ctx.switchToHttp().getRequest();

        const permisos: string[] = req.user.permisos;

        if(!permisos)
            throw new InternalServerErrorException('User Permissions not found in Request');

        return permisos;
        
    }
);