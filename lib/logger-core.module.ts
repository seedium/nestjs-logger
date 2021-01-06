import { Module, Global, DynamicModule, Provider, Type } from '@nestjs/common';
import {
  LoggerModuleOptions,
  LoggerModuleAsyncOptions,
  LoggerModuleOptionsFactory,
} from './interfaces';
import { LOGGER_MODULE_OPTIONS, LOGGER_TOKEN } from './logger.constants';
import { PinoLogger } from './loggers';
import { CustomProvider } from './interfaces/common.interface';

@Global()
@Module({})
export class LoggerCoreModule {
  static forRoot(options?: LoggerModuleOptions): DynamicModule {
    const engineLoggerProviders = this.createEngineLoggerProviders(options);
    return {
      module: LoggerCoreModule,
      providers: engineLoggerProviders,
      exports: engineLoggerProviders,
    };
  }
  static forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule {
    const engineLoggerProvider: Provider = {
      provide: LOGGER_TOKEN,
      useFactory: (loggerModuleOptions: LoggerModuleOptions) =>
        new PinoLogger(loggerModuleOptions),
      inject: [LOGGER_MODULE_OPTIONS],
    };
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: LoggerCoreModule,
      imports: options.imports,
      providers: [...asyncProviders, engineLoggerProvider],
      exports: [engineLoggerProvider],
    };
  }
  private static createAsyncProviders(
    options: LoggerModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<LoggerModuleOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }
  private static createAsyncOptionsProvider(
    options: LoggerModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: LOGGER_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    const inject = [
      (options.useClass ||
        options.useExisting) as Type<LoggerModuleOptionsFactory>,
    ];
    return {
      provide: LOGGER_MODULE_OPTIONS,
      useFactory: async (optionsFactory: LoggerModuleOptionsFactory) =>
        await optionsFactory.createLoggerOptions(),
      inject,
    };
  }
  private static createEngineLoggerProviders(
    options?: LoggerModuleOptions,
  ): Provider[] {
    return [
      this.createPinoLoggerProvider(options),
      {
        provide: LOGGER_TOKEN,
        useExisting: PinoLogger,
      },
    ];
  }
  private static createPinoLoggerProvider(
    options?: LoggerModuleOptions,
  ): CustomProvider {
    return {
      provide: PinoLogger,
      useFactory: () => new PinoLogger(options),
    };
  }
}
