import { useCallback, useEffect, useState } from "react";

// Same key the Product page already uses — kept as a LIFO list of product ids.
const RECENT_KEY = "hm-signature-recent";
const RECENT_LIMIT = 8;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .filter((id, i, arr) => arr.indexOf(id) === i) // dedup by product id
      .slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function writeRecent(ids: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    /* storage may be unavailable in private mode */
  }
}

/**
 * Recently viewed fragrances: LIFO, deduped by product id, capped at 8,
 * persisted under "hm-signature-recent".
 */
export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>(readRecent);

  // Reflect views made in other tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === RECENT_KEY) setRecentIds(readRecent());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const pushRecent = useCallback((id: string) => {
    if (!id) return;
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_LIMIT);
      writeRecent(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentIds([]);
    writeRecent([]);
  }, []);

  return { recentIds, pushRecent, clearRecent };
}

export { RECENT_KEY, RECENT_LIMIT };
