import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  country: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  category: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  query: string;
}
