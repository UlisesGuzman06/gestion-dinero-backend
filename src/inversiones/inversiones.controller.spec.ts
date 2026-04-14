import { Test, TestingModule } from '@nestjs/testing';
import { InversionesController } from './inversiones.controller';

describe('InversionesController', () => {
  let controller: InversionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InversionesController],
    }).compile();

    controller = module.get<InversionesController>(InversionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
