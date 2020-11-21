import * as pino from 'pino';
import {
  LoggerService,
  OnApplicationShutdown,
  Injectable,
} from '@nestjs/common';
import type { O } from 'ts-toolbelt';
import { ExtendedPinoOptions, PinoEventHandler } from '../interfaces';
import * as isString from 'lodash.isstring';
import * as isPlainObject from 'lodash.isplainobject';

@Injectable()
export class PinoLogger implements LoggerService, OnApplicationShutdown {
  private readonly _finalLogger: PinoEventHandler;
  private readonly _logger: pino.Logger;
  constructor(options?: ExtendedPinoOptions) {
    if (options?.extremeMode?.enabled) {
      const extremeModeTick = options.extremeMode.tick || 10000;
      this._logger = pino(
        options,
        pino.destination({
          sync: false,
          minLength: 4096,
        }),
      );
      this._logger.info('Pino extreme mode is enabled');
      this.flushLogger(extremeModeTick);
      this._finalLogger = pino.final(this._logger, this.finalHandler);
    } else {
      this._logger = pino(options);
    }
  }
  public error(msgOrObject: unknown, trace?: string, context?: string): void {
    this.callFunction('error', msgOrObject, context, trace);
  }
  public warn(msgOrObject: unknown, context?: string): void {
    this.callFunction('warn', msgOrObject, context);
  }
  public log(msgOrObject: unknown, context?: string): void {
    this.callFunction('info', msgOrObject, context);
  }
  public debug(msgOrObject: unknown, context?: string): void {
    this.callFunction('debug', msgOrObject, context);
  }
  public verbose(msgOrObject: unknown, context?: string): void {
    this.callFunction('trace', msgOrObject, context);
  }
  public onApplicationShutdown(signal?: string): void {
    if (this._finalLogger) {
      this._finalLogger(null, signal);
    }
  }
  protected callFunction(
    level: pino.Level,
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    let options: O.Object = {};
    if (isString(message)) {
      options = {
        ...options,
        msg: message,
      };
    } else if (isPlainObject(message)) {
      options = message as O.Object;
    } else {
      options = {
        ...this.transformToObject(message),
        ...(message as Record<string, unknown>),
      };
    }

    if (trace) {
      options = {
        ...options,
        trace,
      };
    }

    this._logger[level]({
      context,
      ...options,
    });
  }
  private flushLogger(tick: number): void {
    setInterval(() => {
      this._logger.flush();
    }, tick).unref();
  }
  private finalHandler(
    err: Error | null,
    finalLogger: pino.Logger,
    evt: string,
  ): void {
    finalLogger.info(`${evt} caught`);

    if (err) {
      finalLogger.error(err, 'error caused exit');
    }
  }
  private transformToObject(obj: any): O.Object {
    const plainObject = {};
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      plainObject[prop] = obj[prop];
    });
    return plainObject;
  }
}
