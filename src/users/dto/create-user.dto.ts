import { UserGenre } from 'src/auth/dto/register.dto';

export class CreateUserDto {
  fullname: string;
  username: string;
  email: string;
  password?: string;
  birthdate: Date;
  country?: string;
  city?: string;
  social_genre?: UserGenre;
  phone?: string;
  spotify_link?: string;
  biography?: string;
  profile_pic?: string;
  cover_pic?: string;
  role_id?: number;
}
