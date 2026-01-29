import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DogCeoApiService } from '../services/dog-ceo-api.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('DogCeoApiService', () => {
  let service: DogCeoApiService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://dog.ceo/api'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DogCeoApiService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DogCeoApiService>(DogCeoApiService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllBreeds', () => {
    it('should fetch all breeds from Dog CEO API', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          message: {
            affenpinscher: [],
            bulldog: ['boston', 'english', 'french'],
            labrador: [],
          },
          status: 'success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAllBreeds();

      expect(result).toEqual({
        affenpinscher: [],
        bulldog: ['boston', 'english', 'french'],
        labrador: [],
      });
      expect(httpService.get).toHaveBeenCalledWith('https://dog.ceo/api/breeds/list/all');
    });

    it('should handle empty breed list', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          message: {},
          status: 'success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAllBreeds();

      expect(result).toEqual({});
    });

    it('should propagate errors from HTTP service', async () => {
      const error = new Error('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getAllBreeds()).rejects.toThrow('Network error');
    });

    it('should use configured API URL', async () => {
      mockConfigService.get.mockReturnValue('https://custom-api.com/api');
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DogCeoApiService,
          { provide: HttpService, useValue: mockHttpService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const customService = module.get<DogCeoApiService>(DogCeoApiService);

      const mockResponse: Partial<AxiosResponse> = {
        data: {
          message: {},
          status: 'success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await customService.getAllBreeds();

      expect(httpService.get).toHaveBeenCalledWith('https://custom-api.com/api/breeds/list/all');
    });
  });

  describe('getBreedImages', () => {
    it('should fetch breed images from Dog CEO API', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          message: [
            'https://images.dog.ceo/breeds/labrador/1.jpg',
            'https://images.dog.ceo/breeds/labrador/2.jpg',
            'https://images.dog.ceo/breeds/labrador/3.jpg',
          ],
          status: 'success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getBreedImages('labrador', 3);

      expect(result).toEqual([
        'https://images.dog.ceo/breeds/labrador/1.jpg',
        'https://images.dog.ceo/breeds/labrador/2.jpg',
        'https://images.dog.ceo/breeds/labrador/3.jpg',
      ]);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://dog.ceo/api/breed/labrador/images/random/3'
      );
    });

    it('should handle single image request', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: {
          message: ['https://images.dog.ceo/breeds/bulldog/1.jpg'],
          status: 'success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getBreedImages('bulldog', 1);

      expect(result).toEqual(['https://images.dog.ceo/breeds/bulldog/1.jpg']);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://dog.ceo/api/breed/bulldog/images/random/1'
      );
    });

    it('should handle large image count', async () => {
      const mockImages = Array.from({ length: 10 }, (_, i) => 
        `https://images.dog.ceo/breeds/poodle/${i + 1}.jpg`
      );

      const mockResponse: Partial<AxiosResponse> = {
        data: {
          message: mockImages,
          status: 'success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getBreedImages('poodle', 10);

      expect(result).toHaveLength(10);
      expect(result).toEqual(mockImages);
    });

    it('should propagate errors from HTTP service', async () => {
      const error = new Error('API error');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getBreedImages('invalid', 3)).rejects.toThrow('API error');
    });

    it('should handle different breed names correctly', async () => {
      const breeds = ['labrador', 'bulldog', 'poodle', 'german-shepherd'];
      
      for (const breed of breeds) {
        const mockResponse: Partial<AxiosResponse> = {
          data: {
            message: [`https://images.dog.ceo/breeds/${breed}/1.jpg`],
            status: 'success',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(mockResponse));

        await service.getBreedImages(breed, 1);

        expect(httpService.get).toHaveBeenCalledWith(
          `https://dog.ceo/api/breed/${breed}/images/random/1`
        );
      }
    });
  });
});