import {
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
} from '@nestjs/common';

export type CustomProvider<T = unknown> =
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;
