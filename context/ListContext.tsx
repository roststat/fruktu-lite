"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCartProductById, getItemWeightKg } from "@/data/catalog";

interface ListItem {
  productId: string;
  quantity: number;
}

interface ListContextValue {
  items: ListItem[];
  isOpen: boolean;
  openList: () => void;
  closeList: () => void;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  getQuantity: (productId: string) => number;
  totalCount: number;
  totalQuantity: number;
  totalPrice: number;
  totalWeight: number;
  removedItems: ListItem[];
  restoreItem: (productId: string) => void;
  clearRemoved: () => void;
  clearList: () => void;
}

const ListContext = createContext<ListContextValue | null>(null);

const STORAGE_KEY = "shopping-list";

export function ListProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [removedItems, setRemovedItems] = useState<ListItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = (productId: string, quantity = 1) => {
    setRemovedItems((prev) => prev.filter((i) => i.productId !== productId));
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        setRemovedItems((removed) => [
          existing,
          ...removed.filter((i) => i.productId !== productId),
        ]);
      }
      return prev.filter((i) => i.productId !== productId);
    });
  };

  const restoreItem = (productId: string) => {
    const removed = removedItems.find((i) => i.productId === productId);
    if (!removed) return;
    setItems((prev) => {
      if (prev.some((i) => i.productId === productId)) return prev;
      return [...prev, removed];
    });
    setRemovedItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearRemoved = () => setRemovedItems([]);
  const clearList = () => { setItems([]); setRemovedItems([]); };

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0.001) {
      removeItem(productId);
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        );
      }
      return [...prev, { productId, quantity }];
    });
  };

  const getQuantity = (productId: string) =>
    items.find((i) => i.productId === productId)?.quantity ?? 0;

  const totalCount = useMemo(() => items.length, [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const totalPrice = useMemo(
    () =>
      items.reduce((sum, i) => {
        const entry = getCartProductById(i.productId);
        return sum + (entry ? Math.round(entry.price * i.quantity) : 0);
      }, 0),
    [items]
  );

  const totalWeight = useMemo(
    () =>
      items.reduce((sum, i) => {
        const entry = getCartProductById(i.productId);
        return sum + (entry ? getItemWeightKg(entry.product, i.quantity) : 0);
      }, 0),
    [items]
  );

  const value: ListContextValue = {
    items,
    isOpen,
    openList: () => setIsOpen(true),
    closeList: () => setIsOpen(false),
    addItem,
    removeItem,
    setQuantity,
    getQuantity,
    totalCount,
    totalQuantity,
    totalPrice,
    totalWeight,
    removedItems,
    restoreItem,
    clearRemoved,
    clearList,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}

export function useList() {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error("useList must be used within ListProvider");
  return ctx;
}
