import * as chai from 'chai';
import { Test } from '@nestjs/testing';
import { Injectable, LoggerService } from '@nestjs/common';
import { PinoLogger } from '../lib/loggers';
import { Logger, LoggerModule, LoggerToken } from '../lib';

const expect = chai.expect;

describe('LoggerModule', function () {
  it('`forRoot` should inject pino logger by default', async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()],
    }).compile();
    const pinoLogger = module.get(LoggerToken);
    expect(pinoLogger).instanceOf(PinoLogger);
  });
  it('`forFeature` should inject custom logger', async () => {
    class TestLogger {}
    const module = await Test.createTestingModule({
      imports: [LoggerModule.forFeature(new TestLogger() as LoggerService)],
    }).compile();
    const testLogger = module.get(LoggerToken);
    expect(testLogger).instanceOf(TestLogger);
  });
  describe('Logger module should export', () => {
    @Injectable()
    class TestProvider {
      constructor(public logger: Logger) {}
    }
    it('logger provider', async () => {
      const module = await Test.createTestingModule({
        providers: [TestProvider],
        imports: [LoggerModule.forRoot()],
      }).compile();
      const testProvider = module.get(TestProvider);
      expect(testProvider).property('logger').instanceOf(Logger);
    });
    it('logger provider and inject engine logger', async () => {
      const module = await Test.createTestingModule({
        providers: [TestProvider],
        imports: [LoggerModule.forRoot()],
      }).compile();
      const testProvider = module.get(TestProvider);
      expect(testProvider.logger).property('_logger').instanceOf(PinoLogger);
    });
    it('transient provider and provide unique instance for each class', async () => {
      @Injectable()
      class SecondTestProvider {
        constructor(public logger: Logger) {}
      }
      const module = await Test.createTestingModule({
        providers: [TestProvider, SecondTestProvider],
        imports: [LoggerModule.forRoot()],
      }).compile();
      const testProvider = module.get(TestProvider);
      const secondTestProvider = module.get(SecondTestProvider);
      expect(testProvider.logger).not.eq(secondTestProvider.logger);
    });
  });
});
