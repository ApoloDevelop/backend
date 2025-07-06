import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-lastfm';

@Injectable()
export class LastfmStrategy extends PassportStrategy(Strategy, 'lastfm') {
  constructor() {
    super({
      api_key: process.env.LASTFM_API_KEY,
      secret: process.env.LASTFM_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/lastfm/callback`,
    });
  }

  async validate(
    token: string,
    tokenSecret: string,
    profile: any,
    done: Function,
  ) {
    // Aquí puedes adaptar el perfil a tu modelo de usuario
    const user = {
      ...profile,
      token,
      tokenSecret,
      provider: 'lastfm',
    };
    done(null, user);
  }
}
