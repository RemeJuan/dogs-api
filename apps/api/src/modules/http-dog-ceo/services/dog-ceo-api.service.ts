import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DogCeoApiService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.get<string>('DOG_CEO_API_URL', 'https://dog.ceo/api');
  }

  async getAllBreeds(): Promise<Record<string, string[]>> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/breeds/list/all`)
    );
    return response.data.message;
  }

  async getBreedImages(breed: string, count: number): Promise<string[]> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/breed/${breed}/images/random/${count}`)
    );
    return response.data.message;
  }
}