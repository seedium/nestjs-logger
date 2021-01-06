import { DynamicModule, LoggerService, Type } from '@nestjs/common';
import { LoggerModuleAsyncOptions, LoggerModuleOptions } from './interfaces';
import { LoggerCoreModule } from './logger-core.module';
import { Logger } from './logger.provider';

export class LoggerModule {
  static forRoot(options?: LoggerModuleOptions): DynamicModule {
    return {
      module: LoggerModule,
      imports: [LoggerCoreModule.forRoot(options)],
    };
  }
  static forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule {
    return {
      module: LoggerModule,
      imports: [LoggerCoreModule.forRootAsync(options)],
    };
  }
  static forFeature(engineLogger?: Type<LoggerService>): DynamicModule {
    engineLogger = engineLogger || Logger;
    return {
      module: LoggerModule,
      providers: [engineLogger],
      exports: [engineLogger],
    };
  }
}
