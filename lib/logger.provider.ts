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
import { LoggerToken } from './constants';

@Injectable({ scope: Scope.TRANSIENT })
export class Logger implements LoggerService {
  @Optional() @Inject(LoggerToken) private _logger: LoggerService;

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
  public log(messageOrObject: unknown): void {
    this.callFunction('log', messageOrObject);
  }
  public error(messageOrObject: unknown): void {
    if (messageOrObject instanceof Error) {
      this.callFunction(
        'error',
        {
          error: messageOrObject.name,
          msg: messageOrObject.message,
        },
        messageOrObject.stack,
      );
    } else {
      this.callFunction('error', messageOrObject);
    }
  }
  public warn(messageOrObject: unknown): void {
    this.callFunction('warn', messageOrObject);
  }
  public debug(messageOrObject: unknown): void {
    this.callFunction('debug', messageOrObject);
  }
  public verbose(messageOrObject: unknown): void {
    this.callFunction('verbose', messageOrObject);
  }
  protected callFunction(
    level: LogLevel,
    message: unknown,
    trace?: string,
  ): void {
    if (!this._logger || !this._logger[level]) {
      return;
    }
    if (trace && level === 'error') {
      this._logger.error(message, trace, this.context);
    } else {
      (this._logger as Required<LoggerService>)[level](message, this.context);
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
