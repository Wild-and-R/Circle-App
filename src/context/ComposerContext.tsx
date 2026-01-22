import { createContext, useContext } from "react";

interface ComposerContextValue {
  openComposer: () => void;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

export const useComposer = () => {
  const ctx = useContext(ComposerContext);
  if (!ctx) {
    throw new Error("useComposer must be used within ComposerProvider");
  }
  return ctx;
};

export const ComposerProvider = ComposerContext.Provider;
