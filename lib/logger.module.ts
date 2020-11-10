import { DynamicModule, LoggerService } from '@nestjs/common';
import { Logger } from './logger.provider';
import { PinoLogger } from './loggers';
import { LoggerToken } from './constants';
import { ExtendedPinoOptions } from './interfaces';

export class LoggerModule {
  static forRoot(options?: ExtendedPinoOptions): DynamicModule {
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
    };
  }
  static forFeature(featureLogger: LoggerService): DynamicModule {
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
    };
  }
}
