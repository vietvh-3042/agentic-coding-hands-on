"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "@/shared/hooks/use-click-outside";
import { createClient } from "@/shared/infrastructure/supabase/client";

export interface KudosRecipient {
  id: string;
  displayName: string;
}

export interface KudosRecipientSelectProps {
  /** Currently selected recipient, `null` if none has been picked yet. */
  value: KudosRecipient | null;
  /** Called with the chosen profile when the user picks one from the list —
   *  never with free text, so the form can only ever submit a real profile id.
   *  (base `no-unused-vars` cannot see this is a type-only parameter name.) */
  // eslint-disable-next-line no-unused-vars
  onSelect: (recipient: KudosRecipient) => void;
  /** Reflects the server's `recipientId` validation error, if any. */
  invalid?: boolean;
}

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_LIMIT = 10;

/**
 * Recipient search + autocomplete field — Figma node B (mms_B_Chọn người nhận,
 * mms_B.2_Search). Debounced `profiles.display_name ilike` query against the
 * anon/authenticated-readable `profiles` table (RLS: "profiles readable by
 * all"); selecting a row commits its real `id`, so free text alone can never
 * satisfy the required field.
 */
export default function KudosRecipientSelect({ value, onSelect, invalid }: KudosRecipientSelectProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value?.displayName ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<KudosRecipient[]>([]);
  const [searching, setSearching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the draft input text in sync whenever the committed value changes
  // externally (e.g. form reset on modal close). Adjusted during render with
  // a prev-value guard — the react.dev-recommended alternative to a sync effect.
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setQuery(value?.displayName ?? "");
  }

  useClickOutside(
    rootRef,
    () => {
      setOpen(false);
      setQuery(value?.displayName ?? "");
    },
    open,
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length === 0) {
      return undefined;
    }

    const supabase = createClient();
    const timer = window.setTimeout(async () => {
      // Flip the loading flag from inside the callback, not synchronously in
      // the effect body — react-hooks/set-state-in-effect only allows
      // setState here once we're past the debounce and truly starting a fetch.
      setSearching(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", `%${trimmed}%`)
        .limit(SEARCH_LIMIT);

      if (error) {
        console.warn(`KudosRecipientSelect: profiles search failed: ${error.message}`);
        setResults([]);
        setSearching(false);
        return;
      }

      // Validate at the boundary: the browser client isn't generic over
      // `Database`, so filter rows to the shape this field actually needs.
      const rows = (data ?? []).filter(
        (row): row is { id: string; display_name: string } =>
          typeof row?.id === "string" && typeof row?.display_name === "string",
      );
      setResults(rows.map((row) => ({ id: row.id, displayName: row.display_name })));
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  // `results` can still hold a stale batch from a previous longer query; once
  // the input is cleared, derive an empty list for render instead of also
  // clearing state synchronously inside the effect above.
  const visibleResults = query.trim().length === 0 ? [] : results;

  return (
    <div ref={rootRef} className="relative flex-1">
      <div
        className={`flex h-14 w-full items-center gap-4 rounded-lg border bg-white px-6 ${
          invalid ? "border-[#CF1322]" : "border-[#998C5F]"
        }`}
      >
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={t("kudos:recipient.placeholder")}
          className="flex-1 bg-transparent text-base font-bold text-[#00101A] outline-none"
        />
        <button
          type="button"
          aria-label={t("kudos:recipient.label")}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={`shrink-0 text-[#00101A] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </button>
      </div>

      {open && query.trim().length > 0 && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+8px)] left-0 z-10 max-h-56 w-full overflow-y-auto rounded-lg border border-[#998C5F] bg-white py-2 shadow-lg"
        >
          {visibleResults.length === 0 ? (
            <li className="px-6 py-2 text-sm font-bold text-[#999999]">
              {searching ? t("kudos:recipient.searching") : t("kudos:recipient.empty")}
            </li>
          ) : (
            visibleResults.map((recipient) => (
              <li key={recipient.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={recipient.id === value?.id}
                  onClick={() => {
                    onSelect(recipient);
                    setQuery(recipient.displayName);
                    setOpen(false);
                  }}
                  className="w-full px-6 py-2 text-left text-sm font-bold text-[#00101A] hover:bg-[#FFEA9E]/30"
                >
                  {recipient.displayName}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
