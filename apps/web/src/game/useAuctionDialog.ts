import { useEffect, useState } from 'react';

export function useAuctionDialog(id: string | undefined, decision: string, ready: boolean) {
  const key = `${id}:${decision}`;
  const [introduced, setIntroduced] = useState<string>();
  const [dismissed, setDismissed] = useState<string>();
  useEffect(() => {
    if (!id || !ready || introduced === id) return;
    const timer = window.setTimeout(() => setIntroduced(id), 1800);
    return () => window.clearTimeout(timer);
  }, [id, ready, introduced]);
  return {
    hidden: introduced !== id || dismissed === key,
    close: () => setDismissed(key),
    reopen: () => {
      setIntroduced(id);
      setDismissed(undefined);
    },
  };
}
