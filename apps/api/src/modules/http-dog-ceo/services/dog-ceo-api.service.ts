import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class DogCeoApiService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(DogCeoApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.get<string>('DOG_CEO_API_URL', 'https://dog.ceo/api');
  }

  async getAllBreeds(): Promise<Record<string, string[]>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/breeds/list/all`).pipe(
          catchError((error: AxiosError) => {
            this.handleHttpError(error, 'Failed to fetch breeds');
            throw error;
          })
        )
      );
      return response.data.message;
    } catch (error) {
      this.logger.error(`Error fetching all breeds: ${error.message}`);
      throw new HttpException(
        'Failed to fetch breeds from external API',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getBreedImages(breed: string, count: number): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/breed/${breed}/images/random/${count}`).pipe(
          catchError((error: AxiosError) => {
            this.handleHttpError(error, `Failed to fetch images for breed: ${breed}`);
            throw error;
          })
        )
      );
      return response.data.message;
    } catch (error) {
      this.logger.error(`Error fetching images for breed ${breed}: ${error.message}`);
      
      // Check if it's a 404 from Dog CEO API (breed not found)
      if (error.response?.status === 404) {
        throw new HttpException(
          `Breed '${breed}' not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      throw new HttpException(
        'Failed to fetch breed images from external API',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private handleHttpError(error: AxiosError, context: string): void {
    if (error.response) {
      this.logger.error(`${context} - Status: ${error.response.status}, Message: ${error.message}`);
    } else if (error.request) {
      this.logger.error(`${context} - No response received: ${error.message}`);
    } else {
      this.logger.error(`${context} - ${error.message}`);
    }
  }
}