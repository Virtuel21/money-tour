import { useState } from 'react';

/** Dismissal is local UI state, keyed to the decision rather than network ticks. */
export function useSpectatorDialog(key: string, spectator: boolean) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  return {
    hidden: spectator && dismissed === key,
    onClose: spectator ? () => setDismissed(key) : undefined,
    reopen: () => setDismissed(null),
  };
}
