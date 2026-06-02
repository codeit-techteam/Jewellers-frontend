import { useCallback, useMemo, useRef, useState } from 'react';

type QueryRefreshSource = {
  refetch: () => Promise<unknown>;
  isRefetching?: boolean;
  isFetching?: boolean;
  isPending?: boolean;
  data?: unknown;
};

/**
 * Coordinates pull-to-refresh across one or more React Query observers.
 * Uses `isRefetching` so the spinner only appears during user-initiated refresh,
 * not on the initial load.
 */
export function usePullToRefresh(queries: QueryRefreshSource[]) {
  const isRefreshing = useMemo(
    () => queries.some((q) => q.isRefetching === true),
    [queries],
  );

  const onRefresh = useCallback(() => {
    void Promise.all(queries.map((q) => q.refetch()));
  }, [queries]);

  return { isRefreshing, onRefresh };
}

/**
 * Pull-to-refresh for screens that load data outside React Query.
 * Ignores overlapping refresh gestures while a request is in flight.
 */
export function usePullToRefreshCallback(refetch: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);

  const onRefresh = useCallback(() => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setRefreshing(true);
    void refetch().finally(() => {
      inFlightRef.current = false;
      setRefreshing(false);
    });
  }, [refetch]);

  return { isRefreshing: refreshing, onRefresh };
}
