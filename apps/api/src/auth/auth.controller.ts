import { Response } from 'express';
import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ValidateJwtAuth } from '../auth/decorators';

import { AuthService } from './auth.service';
import { LoginUserDto, NewPasswordDto, ReestablecerDatosDto } from './dto';


@Controller('auth')
export class AuthController {

  private authToken: string; //  nombre de la cookie donde se almacenará el token

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.authToken = this.configService.get<string>('authToken');
  }

  // RUTA PUBLICA: VALIDAR TOKEN MEDIANTE COOKIE
  @Get('validate')
  @ValidateJwtAuth()
  validate(){
    return true;
  }
  
  // RUTA PROTEGIDA: CERRAR SESION SOLO SI SE TIENE UN TOKEN
  @Get('logout')
  @ValidateJwtAuth()
  logout(@Res() res: Response) {
    
    res.clearCookie(this.authToken, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'strict' 
    });
    
    return res.send({message: 'logout successfully'});
  }

  // RUTA PUBLICA: LOGIN
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async loginUser(@Body() loginDto: LoginUserDto, @Res() res: Response) {
    
    const loginResult = await this.authService.loginUser(loginDto);
    
    // Configurar la cookie con el token
    res.cookie(this.authToken, loginResult.token, {
      httpOnly: true, // La cookie solo es accesible mediante HTTP
      secure: true, // Solo se envía en HTTPS en producción
      maxAge: 24 * 60 * 60 * 1000, // La cookie expirará en 1 hora (ajusta según tu necesidad)
      sameSite: 'strict', // Protege contra ataques CSRF
    });

    // Enviar respuesta al cliente sin incluir el token directamente en el body
    return res.send({
      user: loginResult.user, // Información del usuario
    });

  }

  // RUTA PUBLICA: ENVIAR CORREO PARA REESTABLECER CONTRASEÑA DEL USER
  @HttpCode(HttpStatus.OK)
  @Post('olvide-password')
  olvidePassword(@Body() olvidePasswordDto: ReestablecerDatosDto) {
    return this.authService.olvidePassword(olvidePasswordDto);
  }
  
  // RUTA PUBLICA: CONFIRMAR QUE EL TOKEN ES VALIDO
  @Get('olvide-password/:token')
  comprobarTokenOlvidePassword(@Param('token') token: string) {
    return this.authService.comprobarTokenOlvidePassword(token);
  }
  
  // RUTA PUBLICA: ENVIAR NUEVA CONTRASEÑA
  @HttpCode(HttpStatus.OK)
  @Post('olvide-password/:token')
  nuevaPassword(@Param('token') token: string, @Body() newPasswordDto: NewPasswordDto) {
    return this.authService.nuevaPassword(token, newPasswordDto);
  }

  // RUTA PUBLICA: ENVIAR CORREO PARA REESTABLECER CUENTA
  @HttpCode(HttpStatus.OK)
  @Post('reestablecer-cuenta')
  reestablecerCuenta(@Body() reestablecerCuentaDto: ReestablecerDatosDto) {
    return this.authService.reestablecerCuenta(reestablecerCuentaDto);
  }

  // RUTA PUBLICA: CONFIRMAR LA CUENTA DEL USER EN CASO QUE SE HAYA ELIMINADO
  @HttpCode(HttpStatus.OK)
  @Get('confirmar/:token')
  confirmarCuenta(@Param('token') token: string) {
    return this.authService.confirmarCuenta(token);
  }

}
