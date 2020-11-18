import { DynamicModule, LoggerService } from '@nestjs/common';
import { Logger } from './logger.provider';
import { PinoLogger } from './loggers';
import { LoggerToken } from './constants';
import { ExtendedPinoOptions, LoggerModuleOptions } from './interfaces';

export class LoggerModule {
  static forRoot(
    options?: ExtendedPinoOptions & LoggerModuleOptions,
  ): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        Logger,
        {
          provide: LoggerToken,
          useFactory: () => new PinoLogger(options),
        },
      ],
      exports: [Logger],
      global: options?.global || false,
    };
  }
  static forFeature(
    featureLogger: LoggerService,
    options: LoggerModuleOptions = {},
  ): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        Logger,
        {
          provide: LoggerToken,
          useValue: featureLogger,
        },
      ],
      exports: [Logger],
      global: options.global || false,
    };
  }
}
