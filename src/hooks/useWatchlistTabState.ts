import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

export type WatchlistViewMode = 'list' | 'cards';
export type SortOrder = 'asc' | 'desc';

const VIEW_STORAGE_KEY_WATCHLIST = 'watchlist:viewMode';

export const useWatchlistViewMode = (): readonly [
  WatchlistViewMode,
  (mode: WatchlistViewMode) => void,
] => {
  const [mode, setMode] = useState<WatchlistViewMode>(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_STORAGE_KEY_WATCHLIST);
      return stored === 'cards' || stored === 'list' ? stored : 'cards';
    } catch {
      return 'cards';
    }
  });

  const setStoredMode = useCallback((newMode: WatchlistViewMode) => {
    setMode(newMode);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY_WATCHLIST, newMode);
    } catch {
      // ignore
    }
  }, []);

  return [mode, setStoredMode] as const;
};

export interface UseWatchlistTabStateConfig<
  SortKey extends string,
  StatusFilter extends string,
> {
  defaultSort: SortKey;
  defaultStatus: StatusFilter;
  /** Sort direction applied when no per-field override is provided. Defaults to 'desc'. */
  defaultSortOrder?: SortOrder;
  /** Optional per-field override for the direction set when switching to a new field. */
  getDefaultSortOrder?: (field: SortKey) => SortOrder;
}

export interface WatchlistTabState<
  SortKey extends string,
  StatusFilter extends string,
> {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  statusFilter: StatusFilter;
  setStatusFilter: Dispatch<SetStateAction<StatusFilter>>;
  viewMode: WatchlistViewMode;
  setViewMode: (mode: WatchlistViewMode) => void;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  sortField: SortKey;
  sortOrder: SortOrder;
  handleSort: (field: SortKey) => void;
}

/**
 * Shared state machine for a watchlist tab: search, status filter, persisted
 * view mode, paging, and sort. Resets `page` to 0 whenever any of its own
 * inputs change so each tab gets the same pagination behavior for free.
 */
export const useWatchlistTabState = <
  SortKey extends string,
  StatusFilter extends string,
>({
  defaultSort,
  defaultStatus,
  defaultSortOrder = 'desc',
  getDefaultSortOrder,
}: UseWatchlistTabStateConfig<SortKey, StatusFilter>): WatchlistTabState<
  SortKey,
  StatusFilter
> => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(defaultStatus);
  const [viewMode, setViewMode] = useWatchlistViewMode();
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortKey>(defaultSort);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchQuery, sortField, sortOrder, viewMode]);

  const handleSort = (field: SortKey) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(getDefaultSortOrder?.(field) ?? defaultSortOrder);
    }
    setPage(0);
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    page,
    setPage,
    sortField,
    sortOrder,
    handleSort,
  };
};
