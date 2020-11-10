import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { LoggerService } from '@nestjs/common';
import { Logger } from '../lib';

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
  let testLogger: Logger;
  beforeEach(() => {
    testEngineLogger = new TestEngineLogger();
    testLogger = new Logger();
    // @ts-expect-error engine logger will be injected automatically
    testLogger._logger = testEngineLogger;
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('logging levels', () => {
    it('valid log level should be proxies to engine logger', () => {
      const mock = sinon.mock(testEngineLogger);
      logLevels.forEach((logLevel) => mock.expects(logLevel).calledOnce);
      logLevels.forEach((logLevel) => testLogger[logLevel]('test'));
      mock.verify();
    });
    it('if logger is undefined do nothing', () => {
      // @ts-expect-error simulate a case when engine logger was not injected
      testLogger._logger = undefined;
      const mock = sinon.mock(testEngineLogger);
      logLevels.forEach((logLevel) => mock.expects(logLevel).never());
      logLevels.forEach((logLevel) => testLogger[logLevel]('test'));
      mock.verify();
    });
    it('if some logger level is unavailable should not fall', () => {
      class TestEngineLoggerWithoutLevel implements LoggerService {
        error(): any {}
        log(): any {}
        warn(): any {}
        debug(): any {}
      }
      // @ts-expect-error engine logger will be injected automatically
      testLogger._logger = new TestEngineLoggerWithoutLevel();
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
});
