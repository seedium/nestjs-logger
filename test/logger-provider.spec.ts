import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Module, LoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from '../lib';

chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

describe('LoggerProvider', () => {
  const logLevels = ['error', 'log', 'warn', 'debug', 'verbose'];
  class TestEngineLogger implements LoggerService {
    error(): any {}
    log(): any {}
    warn(): any {}
    debug(): any {}
    verbose(): any {}
  }
  let testEngineLogger: TestEngineLogger;
  let mockTestEngineLogger: sinon.SinonMock;
  let testLogger: Logger;

  beforeEach(() => {
    testEngineLogger = new TestEngineLogger();
    mockTestEngineLogger = sinon.mock(testEngineLogger);
    testLogger = new Logger();
    testLogger.injectLogger(testEngineLogger);
  });
  afterEach(() => {
    sinon.restore();
  });
  it('should inject logger', () => {
    const testLoggerCase = new Logger();
    const testInjectedLogger = new TestEngineLogger();
    expect(testLoggerCase).not.property('_logger');
    testLoggerCase.injectLogger(testInjectedLogger);
    expect(testLoggerCase).property('_logger').eq(testInjectedLogger);
  });
  describe('logging levels', () => {
    it('valid log level should be proxies to engine logger', () => {
      logLevels.forEach(
        (logLevel) => mockTestEngineLogger.expects(logLevel).calledOnce,
      );
      logLevels.forEach((logLevel) => testLogger[logLevel]('test'));
      mockTestEngineLogger.verify();
    });
    it('if logger is undefined do nothing', () => {
      const testLoggerCase = new Logger();
      logLevels.forEach((logLevel) =>
        mockTestEngineLogger.expects(logLevel).never(),
      );
      logLevels.forEach((logLevel) => testLoggerCase[logLevel]('test'));
      mockTestEngineLogger.verify();
    });
    it('if some logger level is unavailable should not fall', () => {
      class TestEngineLoggerWithoutLevel implements LoggerService {
        error(): any {}
        log(): any {}
        warn(): any {}
        debug(): any {}
      }
      testLogger.injectLogger(new TestEngineLoggerWithoutLevel());
      logLevels.forEach((logLevel) => testLogger[logLevel]('test'));
    });
    it('error level can be provided with stack trace', () => {
      const testError = new Error('test');
      testError.stack = 'test-trace';
      const mock = sinon.mock(testEngineLogger);
      mock
        .expects('error')
        .calledWith(testError.message, testError.stack, undefined);
      testLogger.error(testError);
      mock.verify();
    });
    it('can logging string error without context', () => {
      mockTestEngineLogger
        .expects('error')
        .once()
        .withExactArgs('Test', undefined, undefined);
      testLogger.error('Test');
      mockTestEngineLogger.verify();
    });
    it('when logging string error the context should output correctly', () => {
      mockTestEngineLogger
        .expects('error')
        .once()
        .withExactArgs('Test', undefined, 'Context');
      testLogger.setContext('Context');
      testLogger.error('Test');
      mockTestEngineLogger.verify();
    });
    it('context can be overridden in error level', () => {
      const testError = new Error('test');
      mockTestEngineLogger.expects('error').once().withExactArgs(
        {
          error: testError.name,
          msg: testError.message,
        },
        testError.stack,
        'Context',
      );
      testLogger.error(testError, undefined, 'Context');
      mockTestEngineLogger.verify();
    });
  });
  describe('context', () => {
    const testContextName = 'test';
    let testLoggerContext: Logger;
    beforeEach(() => {
      testLoggerContext = new Logger(testContextName);
    });
    it('can be initialized via constructor', () => {
      expect(testLoggerContext).property('context').eq(testContextName);
    });
    it('can be overrided via method `setContext`', () => {
      const overrideContextName = 'override';
      const testLoggerContext = new Logger(testContextName);
      expect(testLoggerContext).property('context').eq(testContextName);
      testLoggerContext.setContext(overrideContextName);
      expect(testLoggerContext).property('context').eq(overrideContextName);
    });
    it('can be overrided on each logger level', () => {
      const overrideContextName = 'override';
      const testMessage = 'test-message';
      const testTrace = 'test-trace';
      testLogger.setContext('testContext');
      mockTestEngineLogger
        .expects('log')
        .once()
        .withExactArgs(testMessage, overrideContextName);
      mockTestEngineLogger
        .expects('warn')
        .once()
        .withExactArgs(testMessage, overrideContextName);
      mockTestEngineLogger
        .expects('debug')
        .once()
        .withExactArgs(testMessage, overrideContextName);
      mockTestEngineLogger
        .expects('verbose')
        .once()
        .withExactArgs(testMessage, overrideContextName);
      mockTestEngineLogger
        .expects('error')
        .once()
        .withExactArgs(testMessage, testTrace, overrideContextName);

      logLevels.forEach((level) => {
        if (level === 'error') {
          testLogger.error(testMessage, testTrace, overrideContextName);
        } else {
          testLogger[level](testMessage, overrideContextName);
        }
      });

      mockTestEngineLogger.verify();
    });
    describe('can be set as', () => {
      it('string', () => {
        const string = 'string';
        testLoggerContext.setContext(string);
        expect(testLoggerContext).property('context').eq(string);
      });
      it('class', () => {
        class TestClass {}
        testLoggerContext.setContext(TestClass);
        expect(testLoggerContext).property('context').eq(TestClass.name);
      });
      it('instance of class', () => {
        class TestClass {}
        const testClass = new TestClass();
        testLoggerContext.setContext(testClass);
        expect(testLoggerContext).property('context').eq(TestClass.name);
      });
    });
  });
  describe('logging custom errors', () => {
    it('should output custom properties of custom errors', () => {
      class TestError extends Error {
        public readonly test: string;
        constructor() {
          super('test');
          this.test = 'foo';
        }
      }
      const testError = new TestError();
      const stubLoggerCallFunction = sinon.stub(
        testLogger,
        <any>'callFunction',
      );
      testLogger.error(testError);
      expect(stubLoggerCallFunction).calledOnceWithExactly(
        'error',
        {
          error: testError.name,
          msg: testError.message,
          test: testError.test,
        },
        undefined,
        testError.stack,
      );
    });
  });
  describe('nest application', () => {
    it('can be used as main logger', async () => {
      @Module({})
      class TestAppModule {}
      mockTestEngineLogger.expects('log').atLeast(1);
      await expect(
        NestFactory.createApplicationContext(TestAppModule, {
          logger: testLogger,
          abortOnError: false,
        }),
      ).eventually.fulfilled;
      mockTestEngineLogger.verify();
    });
    it('should output trace and message properly when error is occurred', async () => {
      const testError = new Error('test');
      class TestProvider {
        constructor() {
          throw testError;
        }
      }
      @Module({
        providers: [TestProvider],
      })
      class TestAppModule {}

      mockTestEngineLogger
        .expects('error')
        .callsFake((message, stack, context) =>
          expect({
            message,
            stack,
            context,
          }).deep.eq({
            message: testError.message,
            stack: testError.stack,
            context: 'ExceptionHandler',
          }),
        );
      const logger = new Logger();
      logger.injectLogger(testEngineLogger);
      await expect(
        NestFactory.createApplicationContext(TestAppModule, {
          logger,
          abortOnError: false,
        }),
      ).eventually.rejectedWith(testError);
      mockTestEngineLogger.verify();
    });
  });
});
