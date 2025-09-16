import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger.module';
import type { Response } from 'express';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [AppController],
      providers: [AppService],
    })
      .useMocker((token) => {
        if (token === HttpService) {
          return {
            get: jest.fn(),
          };
        }
      })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('fetch', () => {
    it('should have fetch method', () => {
      expect(typeof appController.fetch).toBe('function');
    });

    it('should handle missing URL parameter', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await appController.fetch('', mockRes as unknown as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith('URL parameter is required');
    });

    it('should handle invalid URL format', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await appController.fetch('invalid-url', mockRes as unknown as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith('Invalid URL format');
    });
  });
});
