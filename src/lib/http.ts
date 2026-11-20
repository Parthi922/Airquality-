export class UpstreamFetchError extends Error {
  readonly status: number;

  constructor(message: string, status: number = 502) {
    super(message);
    this.name = 'UpstreamFetchError';
    this.status = status;
  }
}

export interface FetchRetryOptions {
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches JSON from an upstream HTTP service with per-attempt timeouts and
 * exponential backoff retries on transient 429/5xx or network failures.
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  options: FetchRetryOptions = {},
): Promise<T> {
  const { timeoutMs = 7000, retries = 2, baseDelayMs = 250, fetchImpl = fetch } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        return (await response.json()) as T;
      }

      const isTransient = response.status === 429 || response.status >= 500;
      if (!isTransient || attempt === retries) {
        throw new UpstreamFetchError(
          `Upstream data service returned HTTP ${response.status}.`,
          response.status >= 500 ? 502 : response.status,
        );
      }
      lastError = new UpstreamFetchError(`HTTP ${response.status}`, response.status);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof UpstreamFetchError && err.status < 500 && err.status !== 429) {
        throw err;
      }
      lastError = err;
      if (attempt === retries) {
        break;
      }
    }

    const jitter = Math.floor(Math.random() * 60);
    await sleep(baseDelayMs * Math.pow(2, attempt) + jitter);
  }

  if (lastError instanceof UpstreamFetchError) {
    throw lastError;
  }
  throw new UpstreamFetchError('Unable to reach environmental data service.', 504);
}
