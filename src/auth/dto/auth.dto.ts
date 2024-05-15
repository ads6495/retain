import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class AuthPayloadDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
