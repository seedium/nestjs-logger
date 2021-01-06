import type { LoggerOptions as PinoLoggerOptions } from 'pino';

interface ExtreameModePinoOptions {
  enabled?: boolean;
  tick?: number;
}

export interface PinoOptions extends PinoLoggerOptions {
  extremeMode?: ExtreameModePinoOptions;
}

export type PinoEventHandler = (
  _error: Error | null,
  ..._args: unknown[]
) => void;
