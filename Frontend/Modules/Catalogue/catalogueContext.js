import { createContext, useContext } from "react";

export const CatalogueContext = createContext(null);

export function useCatalogue() {
  const value = useContext(CatalogueContext);
  if (!value) throw new Error("useCatalogue must be used inside CatalogueProvider.");
  return value;
}
