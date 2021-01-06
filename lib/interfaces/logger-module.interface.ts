import { ModuleMetadata, Type } from '@nestjs/common';
import { PinoOptions } from './loggers';

export type LoggerModuleOptions = PinoOptions;

export interface LoggerModuleOptionsFactory {
  createLoggerOptions(): Promise<LoggerModuleOptions> | LoggerModuleOptions;
}

export interface LoggerModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<LoggerModuleOptionsFactory>;
  useClass?: Type<LoggerModuleOptionsFactory>;
  useFactory?: (
    ..._args: any[]
  ) => Promise<LoggerModuleOptions> | LoggerModuleOptions;
  inject?: any[];
}
