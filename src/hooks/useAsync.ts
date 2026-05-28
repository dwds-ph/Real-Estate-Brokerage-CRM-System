import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────

export type AsyncStatus = "idle" | "pending" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  status: AsyncStatus;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface AsyncOptions {
  /** If true, don't run the async function automatically on mount */
  immediate?: boolean;
  /** Called when the async function succeeds */
  onSuccess?: (data: unknown) => void;
  /** Called when the async function fails */
  onError?: (error: Error) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = [],
  options: AsyncOptions = {},
) {
  const { immediate = true, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    status: immediate ? "pending" : "idle",
    isLoading: immediate,
    isSuccess: false,
    isError: false,
  });

  const mountedRef = useRef(true);
  const executeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      status: "pending",
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
    }));

    try {
      const result = await asyncFn();

      if (mountedRef.current) {
        setState({
          data: result,
          error: null,
          status: "success",
          isLoading: false,
          isSuccess: true,
          isError: false,
        });
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          data: null,
          error,
          status: "error",
          isLoading: false,
          isSuccess: false,
          isError: true,
        });
        onError?.(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  executeRef.current = execute;

  useEffect(() => {
    if (immediate) {
      execute();
    }
    return () => {
      // Cleanup if needed
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate]);

  return {
    ...state,
    execute,
  };
}
