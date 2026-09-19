export class ModelUnavailableError extends Error {
  public constructor(cause?: unknown) {
    super('The model is unavailable.', { cause });
    this.name = 'ModelUnavailableError';
  }
}

export class MemoryUnavailableError extends Error {
  public constructor(cause?: unknown) {
    super('Memory persistence is unavailable.', { cause });
    this.name = 'MemoryUnavailableError';
  }
}
