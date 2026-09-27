/** Preserve the desktop composition; portrait view uses real, undistorted world units. */
export function cameraBounds(width: number, height: number, mobile: boolean) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const halfWidth = Math.max(17, (mobile ? 12 : 13.3) * aspect);
  return { halfWidth, halfHeight: halfWidth / aspect };
}

export function followPlayer({
  mobile,
  overview,
  selecting,
  phase,
  cue,
  bot,
  self,
  active,
  winner,
}: {
  mobile: boolean;
  overview: boolean;
  selecting: boolean;
  phase: string;
  cue?: string;
  bot: boolean;
  self?: string;
  active: string;
  winner: boolean;
}) {
  return (
    mobile &&
    !overview &&
    !selecting &&
    !bot &&
    !winner &&
    (!self || self === active) &&
    phase !== 'end' &&
    phase !== 'auction' &&
    cue !== 'turn'
  );
}
