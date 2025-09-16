import { IsNotEmpty, IsUrl } from 'class-validator';

export class FetchUrlDto {
  @IsNotEmpty({ message: 'URL parameter is required' })
  @IsUrl({}, { message: 'Invalid URL format' })
  url: string;
}
