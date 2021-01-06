import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { PinoLogger } from '../lib/loggers';
import {
  Logger,
  LoggerModule,
  LOGGER_TOKEN,
  LoggerModuleOptionsFactory,
} from '../lib';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('LoggerModule', function () {
  it('`forRoot` should inject pino logger by default', async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()],
    }).compile();
    const pinoLogger = module.get(LOGGER_TOKEN);
    expect(pinoLogger).instanceOf(PinoLogger);
  });
  describe('`forRootAsync`', () => {
    it('should inject pino logger by default', async () => {
      const module = await Test.createTestingModule({
        imports: [
          LoggerModule.forRootAsync({
            useFactory: () => ({
              enabled: false,
            }),
          }),
        ],
      }).compile();
      const pinoLogger = module.get(LOGGER_TOKEN);
      expect(pinoLogger).instanceOf(PinoLogger);
    });
    it('can be used with `useClass` options factory', async () => {
      @Injectable()
      class TestLoggerConfigService implements LoggerModuleOptionsFactory {
        public createLoggerOptions() {
          return {
            enabled: false,
          };
        }
      }
      await expect(
        Test.createTestingModule({
          imports: [
            LoggerModule.forRootAsync({
              useClass: TestLoggerConfigService,
            }),
          ],
        }).compile(),
      ).eventually.fulfilled;
    });
    it('can reuse existing config class', async () => {
      @Injectable()
      class TestLoggerConfigService implements LoggerModuleOptionsFactory {
        public createLoggerOptions() {
          return {
            enabled: false,
          };
        }
      }
      @Module({
        providers: [TestLoggerConfigService],
        exports: [TestLoggerConfigService],
      })
      class TestModule {}

      await expect(
        Test.createTestingModule({
          imports: [
            LoggerModule.forRootAsync({
              imports: [TestModule],
              useExisting: TestLoggerConfigService,
            }),
          ],
        }).compile(),
      ).eventually.fulfilled;
    });
  });
  describe('Logger module export', () => {
    @Injectable()
    class TestProvider {
      constructor(public logger: Logger) {}
    }
    it('no logger by default', async () => {
      const module = await Test.createTestingModule({
        imports: [LoggerModule.forRoot()],
      }).compile();
      await expect(module.resolve(Logger)).eventually.rejected;
    });
    it('logger when for feature is provided', async () => {
      const module = await Test.createTestingModule({
        imports: [LoggerModule.forRoot(), LoggerModule.forFeature()],
      }).compile();
      await expect(module.resolve(Logger)).eventually.instanceof(Logger);
    });
    it('logger provider not available in other modules by default', async () => {
      @Module({
        providers: [TestProvider],
      })
      class TestModule {}
      await expect(
        Test.createTestingModule({
          imports: [LoggerModule.forRoot(), TestModule],
        }).compile(),
      ).eventually.rejected;
    });
    it('without `forRoot` logger provider will be injected without engine logger', async () => {
      const module = await Test.createTestingModule({
        imports: [LoggerModule.forFeature()],
      }).compile();
      await expect(module.resolve(Logger)).eventually.not.property('_logger');
    });
    it('transient provider and provide unique instance for each class', async () => {
      @Injectable()
      class SecondTestProvider {
        constructor(public logger: Logger) {}
      }
      const module = await Test.createTestingModule({
        providers: [TestProvider, SecondTestProvider],
        imports: [LoggerModule.forRoot(), LoggerModule.forFeature()],
      }).compile();
      const testProvider = module.get(TestProvider);
      const secondTestProvider = module.get(SecondTestProvider);
      expect(testProvider.logger).not.eq(secondTestProvider.logger);
    });
    describe('inject in other modules', () => {
      let module: TestingModule;
      beforeEach(async () => {
        @Module({
          providers: [TestProvider],
          imports: [LoggerModule.forFeature()],
        })
        class TestModule {}
        module = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(), TestModule],
        }).compile();
      });
      it('logger provider should be injected when for feature is called', async () => {
        const testProvider = module.get(TestProvider);
        expect(testProvider).property('logger').instanceof(Logger);
      });
      it('by default for feature should inject pino logger', () => {
        const testProvider = module.get(TestProvider);
        expect(testProvider.logger).property('_logger').instanceof(PinoLogger);
      });
    });
  });
});
