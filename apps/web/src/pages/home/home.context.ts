import React, { createContext, useContext, useState } from 'react';

type HomeContextContextValue = {
  selected: string | null;
  setSelected: (s: string | null) => void;
  toggleSelected: (item: string) => void;
};

const HomeContextContext = createContext<HomeContextContextValue | undefined>(
  undefined,
);

export const HomeContextProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  const toggleSelected = (item: string) => {
    setSelected((prev) => (prev === item ? null : item));
  };

  return React.createElement(
    HomeContextContext.Provider,
    { value: { selected, setSelected, toggleSelected } },
    children,
  );
};

export function useHomeContext(): HomeContextContextValue {
  const ctx = useContext(HomeContextContext);

  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const toggleLocal = (item: string) =>
    setLocalSelected((prev) => (prev === item ? null : item));

  if (ctx) return ctx;
  return {
    selected: localSelected,
    setSelected: setLocalSelected,
    toggleSelected: toggleLocal,
  };
}
