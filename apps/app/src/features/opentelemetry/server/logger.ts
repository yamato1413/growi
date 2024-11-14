import { diag, type DiagLogger } from '@opentelemetry/api';

import loggerFactory from '~/utils/logger';

const loggerForDiag = loggerFactory('growi:opentelemetry:diag');


class DiagLoggerBunyanAdapter implements DiagLogger {

  private parseMessage(message: string, args: unknown[]): { logMessage: string, data: object } {
    let logMessage = message;
    let data = {};

    // check whether the message is a JSON string
    try {
      const parsedMessage = JSON.parse(message);
      if (typeof parsedMessage === 'object' && parsedMessage !== null) {
        data = parsedMessage;
        // if parsed successfully, use 'message' property as log message
        logMessage = 'message' in data && typeof data.message === 'string'
          ? data.message
          : message;
      }
    }
    catch (e) {
      // do nothing if the message is not a JSON string
    }

    // merge additional data
    if (args.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argsData = (args as any).reduce((acc, arg) => {
        if (typeof arg === 'string') {
          try {
            const parsed = JSON.parse(arg);
            return { ...acc, ...parsed };
          }
          catch (e) {
            return { ...acc, additionalInfo: arg };
          }
        }
        return { ...acc, ...arg };
      }, {});
      data = { ...data, ...argsData };
    }

    return { logMessage, data };
  }

  error(message: string, ...args): void {
    const { logMessage, data } = this.parseMessage(message, args);
    loggerForDiag.error(logMessage, data);
  }

  warn(message: string, ...args): void {
    const { logMessage, data } = this.parseMessage(message, args);
    loggerForDiag.error(logMessage, data);
  }

  info(message: string, ...args): void {
    const { logMessage, data } = this.parseMessage(message, args);
    loggerForDiag.error(logMessage, data);
  }

  debug(message: string, ...args): void {
    const { logMessage, data } = this.parseMessage(message, args);
    loggerForDiag.error(logMessage, data);
  }

  verbose(message: string, ...args): void {
    const { logMessage, data } = this.parseMessage(message, args);
    loggerForDiag.error(logMessage, data);
  }

}


export const initLogger = (): void => {
  // Enable global logger for OpenTelemetry
  diag.setLogger(new DiagLoggerBunyanAdapter());
};
