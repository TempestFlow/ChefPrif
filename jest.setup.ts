import '@testing-library/jest-dom';

// Suppress act warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const message = args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message;
        if (arg && typeof (arg as any).toString === 'function') return (arg as any).toString();
        return String(arg);
      })
      .join(' ');

    if (message.includes('not wrapped in act')) {
      return;
    }

    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});