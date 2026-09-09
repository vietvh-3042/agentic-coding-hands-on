"use client";

import { useOptimistic, useState, useTransition } from "react";
import { heartKudo, unheartKudo } from "@/features/kudos/application/actions/heart-kudo";
import CustomSvgIcon from "@/shared/ui/custom-svg-icon";

interface HeartState {
  liked: boolean;
  count: number;
}

type HeartAction = "like" | "unlike";

function reduceHeart(state: HeartState, action: HeartAction): HeartState {
  if (action === "like") return { liked: true, count: state.count + 1 };
  return { liked: false, count: Math.max(state.count - 1, 0) };
}

// base `no-unused-vars` cannot see `liked` below is a type-only parameter
// name, not a real declaration — see kudos-hashtag-input.tsx's own note on
// the same limitation.
/* eslint-disable no-unused-vars */
interface HeartButtonProps {
  kudoId: string;
  heartsCount: number;
  likedByMe: boolean;
  /** FN-3 — true on the viewer's own kudos, or a non-interactive (side)
   *  Highlight slide. The DB's RLS self-heart guard is the real boundary;
   *  this only keeps the control from looking clickable when it isn't. */
  disabled: boolean;
  ariaLabel: string;
  buttonClassName: string;
  countClassName: string;
  /** Base icon size/layout classes; liked/unliked color is applied here too. */
  iconClassName: (liked: boolean) => string;
}
/* eslint-enable no-unused-vars */

/**
 * Shared heart (like) control for both card types (`feed-kudo-post-card.tsx`,
 * `highlight-kudo-card.tsx`) — phase 08 (F004). `useOptimistic` renders an
 * immediate guess (±1) on click; the guess is a simplification, not a
 * prediction of the real grant, because only the DB trigger
 * (`resolve_heart_value()`) knows whether today is a special day (BR-003).
 * Once the Server Action resolves, `serverState` is set from ITS returned
 * `heartsCount`/`likedByMe` — the authoritative value — so a special-day x2
 * grant (or a rejected write) reconciles to the real number rather than
 * trusting the optimistic guess. The control disables itself while a
 * request is pending (`isPending`), which is also what keeps rapid repeat
 * clicks from ever queuing a second write (FR-402).
 */
export default function HeartButton({
  kudoId,
  heartsCount,
  likedByMe,
  disabled,
  ariaLabel,
  buttonClassName,
  countClassName,
  iconClassName,
}: HeartButtonProps) {
  const [serverState, setServerState] = useState<HeartState>({ liked: likedByMe, count: heartsCount });
  const [optimisticState, applyOptimistic] = useOptimistic(serverState, reduceHeart);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleClick() {
    if (disabled || isPending) return;
    setErrorMessage(null);
    const wasLiked = serverState.liked;

    startTransition(async () => {
      applyOptimistic(wasLiked ? "unlike" : "like");
      const result = wasLiked ? await unheartKudo(kudoId) : await heartKudo(kudoId);

      if (!result.ok) {
        // Rollback: leaving `serverState` untouched means the next render
        // (transition settled) falls back to the pre-click truth.
        // A locale key for this belongs in kudos-feed.json, but that file
        // is outside phase 08's file ownership — tracked as a follow-up,
        // not left silently unhandled.
        setErrorMessage("Something went wrong. Please try again.");
        return;
      }

      setServerState({ liked: result.likedByMe, count: result.heartsCount });
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        data-testid="heart-button"
        onClick={handleClick}
        disabled={disabled || isPending}
        aria-pressed={optimisticState.liked}
        aria-label={ariaLabel}
        className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span data-testid="heart-count" className={countClassName}>
          {optimisticState.count.toLocaleString("vi-VN")}
        </span>
        <CustomSvgIcon src="/kudos/icons/heart.svg" className={iconClassName(optimisticState.liked)} />
      </button>
      {errorMessage && (
        <span role="alert" className="text-xs font-bold text-[#D4271D]">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
