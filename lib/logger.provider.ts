import {
  Injectable,
  LoggerService,
  Scope,
  Optional,
  Inject,
  LogLevel,
  Type,
} from '@nestjs/common';
import type { O } from 'ts-toolbelt';
import * as isString from 'lodash.isstring';
import { LOGGER_TOKEN } from './logger.constants';

@Injectable({ scope: Scope.TRANSIENT })
export class Logger implements LoggerService {
  @Optional() @Inject(LOGGER_TOKEN) private _logger: LoggerService;

  protected context?: string;

  constructor(@Optional() context?: string | unknown | Type<unknown>) {
    this.context = this.getContextName(context);
  }
  public setContext(context: string | unknown | Type<unknown>): void {
    this.context = this.getContextName(context);
  }
  public injectLogger(logger: LoggerService): void {
    this._logger = logger;
  }
  public log(messageOrObject: unknown, context?: string): void {
    this.callFunction('log', messageOrObject, context);
  }
  public error(
    messageOrObject: unknown,
    trace?: string,
    context?: string,
  ): void {
    if (messageOrObject instanceof Error) {
      const { stack, message, name, ...properties } = messageOrObject;
      this.callFunction(
        'error',
        {
          error: name,
          msg: message,
          ...properties,
        },
        context,
        stack,
      );
    } else {
      this.callFunction('error', messageOrObject, context, trace);
    }
  }
  public warn(messageOrObject: unknown, context?: string): void {
    this.callFunction('warn', messageOrObject, context);
  }
  public debug(messageOrObject: unknown, context?: string): void {
    this.callFunction('debug', messageOrObject, context);
  }
  public verbose(messageOrObject: unknown, context?: string): void {
    this.callFunction('verbose', messageOrObject, context);
  }
  protected callFunction(
    level: LogLevel,
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    if (!this._logger || !this._logger[level]) {
      return;
    }
    context = context || this.context;

    if (level === 'error') {
      this._logger.error(message, trace, context);
    } else {
      (this._logger as Required<LoggerService>)[level](message, context);
    }
  }
  private getContextName(
    context: string | unknown | Type<unknown>,
  ): string | undefined {
    if (!context) {
      return;
    }
    if (typeof context === 'function') {
      return context.name;
    } else if (isString(context)) {
      return context as string;
    } else {
      return (context as O.Object).constructor.name;
    }
  }
}
