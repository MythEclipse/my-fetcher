import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('fetch')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetch(@Query('url') url: string, @Res() res: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, { responseType: 'stream' }),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      res.set(response.headers);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      response.data.pipe(res);
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      res.status(500).send('Error fetching URL');
    }
  }
}
