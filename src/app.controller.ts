import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse, isAxiosError } from 'axios';
import { Readable } from 'stream';
import { ApiQuery } from '@nestjs/swagger';
import { AppService } from './app.service';
import { WinstonLoggerService } from './logger.service';
import { FetchUrlDto } from './dto/fetch-url.dto';

@Controller()
@UseGuards(ThrottlerGuard)
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
    private readonly winstonLogger: WinstonLoggerService,
  ) {}

  @Get('/')
  redirectToSwagger(@Res() res: Response) {
    res.redirect('/api');
  }

  @ApiQuery({ name: 'url', description: 'URL to fetch', type: String })
  @Get('fetch')
  async fetch(@Query() fetchUrlDto: FetchUrlDto, @Res() res: Response) {
    const url = fetchUrlDto.url;

    this.winstonLogger.log(
      `Fetch endpoint called with URL: ${url}`,
      'AppController',
    );

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
      this.winstonLogger.error(
        `Error fetching URL: ${url}`,
        error,
        'AppController',
      );

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
          errorMessage = `HTTP ${statusCode}: ${
            error.response.statusText || 'Unknown error'
          }`;
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
