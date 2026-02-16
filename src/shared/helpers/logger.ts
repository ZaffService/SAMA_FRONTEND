type Logger = {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
};

let logger: Logger = {
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  info: (...args: any[]) =>    console.info(...args),
  debug: (...args: any[]) => console.debug(...args),
};

if (process.env.NEXT_PUBLIC_ENV !== "development") {
    logger = {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {},
    };
}

export default logger;
