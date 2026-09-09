import type { SpotlightNode } from "@/features/kudos/infrastructure/board-queries";
import type { SpotlightNameNodeData } from "./spotlight-name-node";

/** Deterministic string hash → [0,1) — gives every node a stable scatter
 *  position/size across renders (and identical between server and client
 *  hydration) without a DB column to source it from: xPct/yPct/size are
 *  purely decorative (per task brief), the node SET is real. Extracted from
 *  spotlight-board.tsx to keep that file under 200 lines. */
function hashToUnit(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    // Modulo by a large prime every step (instead of a bitwise truncation)
    // keeps `hash` bounded — plain `hash * 31 + charCode` would blow past
    // Number.MAX_SAFE_INTEGER after a few dozen characters and lose
    // precision, making the "deterministic" hash non-deterministic.
    hash = (hash * 31 + input.charCodeAt(i)) % 1000000007;
  }
  return (hash % 10000) / 10000;
}

/** Turns the real recipient node set into laid-out word-cloud nodes with
 *  decorative (client-computed) scatter position/size. */
export function layoutSpotlightNodes(nodes: readonly SpotlightNode[]): SpotlightNameNodeData[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    xPct: 8 + hashToUnit(`${node.id}-x`) * 84,
    yPct: 8 + hashToUnit(`${node.id}-y`) * 84,
    size: hashToUnit(`${node.id}-size`) > 0.5 ? "md" : "sm",
    receivedAt: node.receivedAt,
  }));
}
