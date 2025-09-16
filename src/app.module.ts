import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger.module';

@Module({
  imports: [HttpModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
