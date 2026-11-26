"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";

interface SearchContextValue {
  query: string;
  setQuery: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  focusSearch: () => void;
  registerFocusHandler: (handler: (() => void) | null) => void;
}

const SearchContext = createContext<SearchContextValue>({
  query: "",
  setQuery: () => undefined,
  inputRef: { current: null },
  focusSearch: () => undefined,
  registerFocusHandler: () => undefined
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handlerRef = useRef<(() => void) | null>(null);

  const registerFocusHandler = useCallback((handler: (() => void) | null) => {
    handlerRef.current = handler;
  }, []);

  const focusSearch = useCallback(() => {
    if (handlerRef.current) handlerRef.current();
    else inputRef.current?.focus();
  }, []);

  const value = useMemo(
    () => ({ query, setQuery, inputRef, focusSearch, registerFocusHandler }),
    [query, focusSearch, registerFocusHandler]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useGlobalSearch() {
  return useContext(SearchContext);
}
