export type WalkableSegment = {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  halfWidth: number;
};

export function isWalkableAt(x: number, z: number, segments: WalkableSegment[], margin = 0.45) {
  for (const segment of segments) {
    const dx = segment.bx - segment.ax;
    const dz = segment.bz - segment.az;
    const lengthSq = dx * dx + dz * dz;
    if (lengthSq < 0.01) continue;
    const t = Math.max(0, Math.min(1, ((x - segment.ax) * dx + (z - segment.az) * dz) / lengthSq));
    const px = segment.ax + t * dx;
    const pz = segment.az + t * dz;
    if (Math.hypot(x - px, z - pz) <= Math.max(0.65, segment.halfWidth - margin)) return true;
  }
  return false;
}
