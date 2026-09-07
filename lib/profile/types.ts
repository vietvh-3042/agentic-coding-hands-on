import type { KudoCardData, StarTier } from "@/lib/kudos/types";
import type { FeedCursor } from "@/lib/kudos/board-queries";
import type { HeroTier } from "@/lib/profile/hero-tier";

/** Result of resolving `?id` against the caller's own id (FR-B201). */
export type ResolveTargetResult = { kind: "self" } | { kind: "other"; id: string } | { kind: "notFound" };

/**
 * The keyvisual hero (FR-B202). `department` is read off `profiles.hero_code`
 * (there is no `departments` table — Q1/Q2, clarifications.md), and is
 * `null` for an empty/absent value (`TC_GUI_009`). `heroTier` is `null` when
 * `totalReceived` yields zero distinct senders — a Sunner with no Kudos has
 * no badge at all, which differs from the lowest tier (`TC_GUI_009`).
 */
export interface ProfileHeader {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  department: string | null;
  heroTier: HeroTier | null;
  totalReceived: number;
  starTier: StarTier;
}

/** The five statistics-card counters (FR-B203, `TC_GUI_004`). Only ever
 *  populated for the caller's own profile — see `getProfileStats`'s
 *  `SEC_001` guard. */
export interface ProfileStats {
  kudosReceived: number;
  kudosSent: number;
  heartsReceived: number;
  boxesOpened: number;
  boxesUnopened: number;
}

/** One of the fixed 6 badge-collection slots (FR-B204, `TC_GUI_002`). All 6
 *  `secret_box_icons` rows are always returned, in `sort_order`, so the UI
 *  can render every slot and grey out the locked ones — never a partial or
 *  reordered list. */
export interface ProfileIconSlot {
  id: string;
  name: string;
  imageUrl: string;
  unlocked: boolean;
}

/** Deferred Spam status chip (`TC_GUI_007`) — the field exists so the chip
 *  can be enabled later with no reshaping of the card; nothing renders it
 *  yet. */
export type ProfileCardStatus = "none" | "spam";

/**
 * The board's card shape, widened for the profile screen. Declared here
 * rather than widening `KudoCardData` itself, which belongs to Batch A and
 * is consumed by the live board (`GUI_007`/reuse contract).
 */
export type ProfileFeedCard = KudoCardData & {
  status: ProfileCardStatus;
  /** Whether this Kudo was originally sent anonymously (`kudos.is_anonymous`),
   *  independent of masking. On a Received list the sender is already masked
   *  by the shared board mapper; on the caller's own Sent list the sender is
   *  never masked (`SEC_002`), so this flag is what still marks the row as
   *  an anonymous send. */
  sentAnonymously: boolean;
};

export interface ProfileFeedPage {
  items: ProfileFeedCard[];
  nextCursor: FeedCursor | null;
}
