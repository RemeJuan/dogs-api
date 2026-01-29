import { Test, TestingModule } from '@nestjs/testing';
import { BreedsController } from '../controllers/breeds.controller';
import { BreedsService } from '../services/breeds.service';

describe('BreedsController', () => {
  let controller: BreedsController;
  let service: BreedsService;

  const mockBreedsService = {
    getAllBreeds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BreedsController],
      providers: [
        { provide: BreedsService, useValue: mockBreedsService },
      ],
    }).compile();

    controller = module.get<BreedsController>(BreedsController);
    service = module.get<BreedsService>(BreedsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllBreeds', () => {
    it('should return a list of breeds', async () => {
      const expectedResult = {
        breeds: [
          { name: 'labrador' },
          { name: 'bulldog' },
        ],
      };

      mockBreedsService.getAllBreeds.mockResolvedValue(expectedResult);

      const result = await controller.getAllBreeds();

      expect(result).toEqual(expectedResult);
      expect(service.getAllBreeds).toHaveBeenCalled();
    });

    it('should handle empty breed list', async () => {
      const expectedResult = { breeds: [] };

      mockBreedsService.getAllBreeds.mockResolvedValue(expectedResult);

      const result = await controller.getAllBreeds();

      expect(result).toEqual(expectedResult);
      expect(result.breeds).toHaveLength(0);
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Failed to fetch breeds');
      mockBreedsService.getAllBreeds.mockRejectedValue(error);

      await expect(controller.getAllBreeds()).rejects.toThrow('Failed to fetch breeds');
    });
  });
});