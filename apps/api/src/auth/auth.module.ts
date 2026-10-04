import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtValidateOnlyStrategy } from './strategies/validate-token.strategy';

import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [

    ConfigModule,

    PermissionsModule,

    forwardRef(() => UsersModule),

    forwardRef(() => CommonModule),

    PassportModule.register({defaultStrategy: 'jwt'}),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: ( configService: ConfigService ) => {
        return {
          global: true,
          secret: configService.get<string>('jwtSecret'),
          signOptions: {
            expiresIn: '1d',
          }
        }
      }
    })

  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtValidateOnlyStrategy,
  ],
  exports: [
    AuthService, 
    PassportModule, 
    JwtModule,
    JwtStrategy,
    JwtValidateOnlyStrategy,
  ]
})
export class AuthModule {}
