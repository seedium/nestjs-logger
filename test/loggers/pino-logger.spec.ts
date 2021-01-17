import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import { PinoLogger } from '../../lib/loggers';

chai.use(sinonChai);
const expect = chai.expect;

describe('Pino logger', () => {
  const levels = [
    'error',
    'warn',
    'log',
    'debug',
    'verbose',
    'fatal',
    'trace',
    'info',
  ];
  afterEach(() => {
    sinon.restore();
  });
  it('logger should initialized by default in normal mode', () => {
    const pino = new PinoLogger();
    expect(pino).property('_logger').is.not.undefined;
    expect(pino).not.property('_finalLogger');
  });
  it('should return child logger', () => {
    const pino = new PinoLogger();
    const stubPinoChild = sinon.stub((pino as any)._logger, 'child');
    const testOptions = { levels: 'info' };
    pino.child(testOptions);
    expect(stubPinoChild).calledOnceWithExactly(testOptions);
  });
  describe('logging', () => {
    let mockPinoLogger: sinon.SinonMock;
    let pinoLogger: PinoLogger;
    beforeEach(() => {
      pinoLogger = new PinoLogger({
        enabled: false,
      });
      mockPinoLogger = sinon.mock((pinoLogger as any)._logger);
    });
    it('all levels should work', () => {
      levels.forEach((level) => {
        pinoLogger[level](level);
      });
    });
    it('should log string type', () => {
      const testMessage = 'test';
      mockPinoLogger.expects('info').callsFake((message) =>
        expect(message).deep.eq({
          context: undefined,
          msg: testMessage,
        }),
      );
      pinoLogger.log(testMessage);
      mockPinoLogger.verify();
    });
    it('should log plain object', () => {
      const testMessage = {
        foo: 'bar',
      };
      mockPinoLogger.expects('info').callsFake((message) =>
        expect(message).deep.eq({
          context: undefined,
          ...testMessage,
        }),
      );
      pinoLogger.log(testMessage);
      mockPinoLogger.verify();
    });
    it('should log with context', () => {
      const testMessage = 'test';
      const testContextName = 'context';
      mockPinoLogger.expects('info').callsFake((message) =>
        expect(message).deep.eq({
          context: testContextName,
          msg: testMessage,
        }),
      );
      pinoLogger.log(testMessage, testContextName);
      mockPinoLogger.verify();
    });
    it('should log trace string when error logged', () => {
      const testMessage = 'test';
      const testTrace = 'test-trace';
      mockPinoLogger.expects('error').callsFake((message) =>
        expect(message).deep.eq({
          context: undefined,
          msg: testMessage,
          trace: testTrace,
        }),
      );
      pinoLogger.error(testMessage, testTrace);
      mockPinoLogger.verify();
    });
    it('should log any type', () => {
      class TestError extends Error {
        public readonly test: string;
        constructor() {
          super('test');
          this.test = 'foo';
        }
      }
      const testError = new TestError();
      mockPinoLogger.expects('info').callsFake((message) =>
        expect(message).deep.eq({
          context: undefined,
          message: testError.message,
          stack: testError.stack,
          test: 'foo',
        }),
      );
      pinoLogger.log(testError);
      mockPinoLogger.verify();
    });
  });
  describe('extreme mode', () => {
    it('should create pino in extreme mode', () => {
      const pino = new PinoLogger({
        extremeMode: {
          enabled: true,
        },
      });
      expect(pino).property('_logger').is.not.undefined;
      expect(pino).property('_finalLogger').is.not.undefined;
    });
    it('should set custom tick', () => {
      const stubFlushLogger = sinon.stub(
        PinoLogger.prototype,
        <any>'flushLogger',
      );
      const tick = 5000;
      new PinoLogger({
        extremeMode: {
          enabled: true,
          tick,
        },
      });
      expect(stubFlushLogger).calledOnceWith(tick);
    });
    it('should flush logs by tick', () => {
      const clock = sinon.useFakeTimers();
      const tick = 2000;
      const pino = new PinoLogger({
        extremeMode: {
          enabled: true,
          tick,
        },
      });
      const stubLoggerFlush = sinon.stub((pino as any)._logger, 'flush');
      clock.tick(tick);
      expect(stubLoggerFlush.calledOnce).to.be.true;
    });
    it('logger should disposed when application is goes shutdown', () => {
      const pino = new PinoLogger();
      expect(pino).property('_logger').not.undefined.and.null;
      pino.onApplicationShutdown();
    });
    it('final logger should work on application shutdown', () => {
      const pino = new PinoLogger({
        extremeMode: {
          enabled: true,
        },
      });
      const stubFinalLogger = sinon.stub(pino, <any>'_finalLogger');
      pino.onApplicationShutdown('SIGINT');
      expect(stubFinalLogger).calledOnceWithExactly(null, 'SIGINT');
    });
    describe('final handler', () => {
      let stubFinalLoggerInfo: sinon.SinonStub;
      let stubFinalLoggerError: sinon.SinonStub;
      let pino: PinoLogger;
      const testError = new Error('test');
      const testEvent = 'test';
      beforeEach(() => {
        stubFinalLoggerInfo = sinon.stub();
        stubFinalLoggerError = sinon.stub();
        pino = new PinoLogger();
      });
      it('should log event type', async () => {
        (pino as any).finalHandler(
          null,
          {
            info: stubFinalLoggerInfo,
            error: stubFinalLoggerError,
          },
          testEvent,
        );
        expect(stubFinalLoggerError).not.called;
        expect(stubFinalLoggerInfo).calledTwice;
        expect(stubFinalLoggerInfo.secondCall).calledWithExactly(
          `${testEvent} caught`,
        );
      });
      it('if error occurred log an error', async () => {
        (pino as any).finalHandler(
          testError,
          {
            info: stubFinalLoggerInfo,
            error: stubFinalLoggerError,
          },
          testEvent,
        );
        expect(stubFinalLoggerError).calledOnceWith(testError);
      });
      it('if no error and no event, should just inform about final handler is working', () => {
        (pino as any).finalHandler(null, {
          info: stubFinalLoggerInfo,
          error: stubFinalLoggerError,
        });
        expect(stubFinalLoggerInfo).calledOnce;
      });
    });
  });
});
