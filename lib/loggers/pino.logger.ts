import { pino } from 'pino';
import {
  LoggerService,
  OnApplicationShutdown,
  Injectable,
} from '@nestjs/common';
import type { O } from 'ts-toolbelt';
import * as isString from 'lodash.isstring';
import * as isPlainObject from 'lodash.isplainobject';
import { PinoOptions, PinoEventHandler } from '../interfaces';

@Injectable()
export class PinoLogger implements LoggerService, OnApplicationShutdown {
  private readonly _finalLogger: PinoEventHandler;
  private readonly _logger: pino.Logger;
  constructor(options?: PinoOptions) {
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
  // native pino levels implementations
  public child(bindings: pino.Bindings): pino.Logger {
    return this._logger.child(bindings);
  }
  public fatal(_obj: unknown, _msg?: string, ..._args: unknown[]): void;
  public fatal(_msg: string, ..._args: unknown[]): void;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public fatal(msgOrObject: any, ...args: unknown[]): void {
    this._logger.fatal(msgOrObject, ...args);
  }
  public info(_obj: unknown, _msg?: string, ..._args: unknown[]): void;
  public info(_msg: string, ..._args: unknown[]): void;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public info(msgOrObject: any, ...args: unknown[]): void {
    this._logger.info(msgOrObject, ...args);
  }
  public trace(_obj: unknown, _msg?: string, ..._args: unknown[]): void;
  public trace(_msg: string, ..._args: unknown[]): void;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public trace(msgOrObject: any, ...args: unknown[]): void {
    this._logger.trace(msgOrObject, ...args);
  }
  // Nestjs logger service implementation
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
    evt?: string,
  ): void {
    finalLogger.info('Final flushing logs to stdout...');
    if (evt) {
      finalLogger.info(`${evt} caught`);
    }
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
