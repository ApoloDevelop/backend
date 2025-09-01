//strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants/jwt.constant';
import { UsersService } from 'src/users/users.service';

type JwtPayload = { sub: number; role: number };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // "Authorization: Bearer <token>"
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, // o mejor process.env.JWT_SECRET
    });
  }

  // Lo que devuelvas aquí será req.user
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    // Devuelve una versión "safe" para meter en req.user
    const { password, ...safeUser } = user;
    return safeUser; // => req.user
  }
}
