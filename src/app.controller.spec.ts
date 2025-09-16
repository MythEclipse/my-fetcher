import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger.module';
import { WinstonLoggerService } from './logger.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([]),
        LoggerModule,
      ],
      controllers: [AppController],
      providers: [AppService],
    })
      .useMocker((token) => {
        if (token === HttpService) {
          return {
            get: jest.fn(),
          };
        }
        if (token === WinstonLoggerService) {
          return {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          };
        }
      })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('fetch', () => {
    it('should have fetch method', () => {
      expect(typeof appController.fetch).toBe('function');
    });
  });
});
