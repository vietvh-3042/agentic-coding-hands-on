"use client";

import CustomSvgIcon from "@/components/common/custom-svg-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** The two directions `/profile`'s KUDOS feed can show. Declared here (the
 *  smallest owning file) rather than in `lib/profile/types.ts`, which this
 *  phase does not touch — re-exported by both
 *  `profile-kudos-section.tsx` and the loading Server Action as a
 *  type-only import. */
export type ProfileFeedDirection = "received" | "sent";

export interface ProfileDirectionOption {
  value: ProfileFeedDirection;
  /** Pre-formatted, already carrying its count (e.g. "Đã nhận (12)") — the
   *  section owns interpolation via `t()`, this component only renders. */
  label: string;
}

// base `no-unused-vars` cannot see `direction` below is a type-only
// parameter name, not a real declaration — see kudos-hashtag-input.tsx's
// own note on the same limitation.
/* eslint-disable no-unused-vars */
export interface ProfileDirectionDropdownProps {
  /** Exactly 1 option on another Sunner's profile, 2 on your own
   *  (`SEC_001`/`FUN_009` — the section derives this list from
   *  `stats === null`, never re-decided here). */
  options: readonly ProfileDirectionOption[];
  active: ProfileFeedDirection;
  /** Called for EVERY click, including a re-pick of the already-active
   *  option (`FUN_011`) — this component has no internal toggle-to-null
   *  selection semantics (unlike `highlight-filter-dropdown.tsx`'s shell);
   *  the section is the only place that decides a re-pick is a no-op. */
  onSelect: (direction: ProfileFeedDirection) => void;
}
/* eslint-enable no-unused-vars */

/**
 * KUDOS direction dropdown — FR-B501/502. Built on `components/ui/dropdown-menu.tsx`
 * (Base UI `Menu`), per `AGENTS.md` and clarifications.md Q10: a hand-rolled
 * menu is not an option now that the shadcn baseline is restored. The
 * trigger always shows the ACTIVE option's own label, never an inert
 * placeholder — `FUN_009` starts it at "Đã nhận (N)".
 */
export default function ProfileDirectionDropdown({ options, active, onSelect }: ProfileDirectionDropdownProps) {
  const activeOption = options.find((option) => option.value === active) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="profile-direction-trigger"
        className="flex items-center gap-2 rounded border border-[#998C5F] bg-[#FFEA9E]/10 p-4 transition-colors hover:bg-[#FFEA9E]/20"
      >
        <span className="font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.15px] whitespace-nowrap text-white">
          {activeOption?.label}
        </span>
        <CustomSvgIcon src="/kudos/highlight/down.svg" className="size-6 text-white" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-testid="profile-direction-menu"
        className="min-w-45 border border-[#998C5F] bg-[#101417] text-white"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            data-testid={`profile-direction-option-${option.value}`}
            onClick={() => onSelect(option.value)}
            className={`text-sm font-bold ${option.value === active ? "text-[#FFEA9E]" : "text-white"}`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
