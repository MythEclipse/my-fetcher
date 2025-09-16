import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse, isAxiosError } from 'axios';
import { Readable } from 'stream';
import { AppService } from './app.service';
import { WinstonLoggerService } from './logger.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
    private readonly winstonLogger: WinstonLoggerService,
  ) {}

  @Get()
  getHello(): string {
    this.logger.log('Hello endpoint called');
    this.winstonLogger.log('Processing hello request', 'AppController');
    const result = this.appService.getHello();
    this.winstonLogger.log(`Returning: ${result}`, 'AppController');
    return result;
  }

  @Get('fetch')
  async fetch(@Query('url') url: string, @Res() res: Response) {
    // URL validation
    if (!url) {
      this.winstonLogger.warn('No URL provided', 'AppController');
      return res.status(400).send('URL parameter is required');
    }

    // Decode URL-encoded parameter
    try {
      url = decodeURIComponent(url);
    } catch {
      this.winstonLogger.warn(`Invalid URL encoding: ${url}`, 'AppController');
      return res.status(400).send('Invalid URL encoding');
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      this.winstonLogger.warn(`Invalid URL format: ${url}`, 'AppController');
      return res.status(400).send('Invalid URL format');
    }

    this.logger.log(`Fetch endpoint called with URL: ${url}`);
    this.winstonLogger.log(`Fetching content from: ${url}`, 'AppController');

    try {
      const response: AxiosResponse<Readable> = await lastValueFrom(
        this.httpService.get(url, {
          responseType: 'stream',
          timeout: 30000, // 30 second timeout
          headers: {
            'User-Agent': 'My-Fetcher/1.0 (NestJS Application)',
            Accept: '*/*',
          },
        }),
      );

      const contentType =
        (response.headers['content-type'] as string) || 'unknown';
      this.winstonLogger.log(
        `Successfully fetched from ${url} - Content-Type: ${contentType}`,
        'AppController',
      );

      // Set appropriate headers for the response

      res.set({
        ...response.headers,
        'X-Fetched-From': url,
        'X-Fetch-Timestamp': new Date().toISOString(),
      });

      response.data.pipe(res);
    } catch (error: unknown) {
      this.logger.error(`Error fetching URL: ${url}`, error);

      let errorMessage = 'Error fetching URL';
      let statusCode = 500;

      if (isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused - server may be down';
          statusCode = 502;
        } else if (error.code === 'ENOTFOUND') {
          errorMessage = 'Host not found - check the URL';
          statusCode = 404;
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = 'Request timed out';
          statusCode = 408;
        } else if (error.response) {
          statusCode = error.response.status || 500;
          errorMessage = `HTTP ${statusCode}: ${error.response.statusText || 'Unknown error'}`;
        }
      }

      this.winstonLogger.error(
        `Failed to fetch from ${url}: ${errorMessage}`,
        error,
        'AppController',
      );

      res.status(statusCode).send(errorMessage);
    }
  }
}
