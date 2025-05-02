export class CreateUserDto {
  fullname: string;
  username: string;
  email: string;
  password?: string;
  birthdate: Date;
  country?: string;
  city?: string;
  phone?: string;
  spotify_link?: string;
  biography?: string;
  profile_pic?: string;
  cover_pic?: string;
  auth_strategy?: string;
  role_id?: number;
  oauth_id?: string;
}
