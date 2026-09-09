import type { ReactNode } from "react";

/**
 * Renders a kudo message as safe, literal content — converting any
 * `[text](url)` markdown-style link (the Addlink Box's own output format,
 * see `components/kudos/kudos-content-editor.tsx`) into a real `<a>`
 * element, while leaving everything else as plain text.
 *
 * Built entirely from React elements/strings — never `dangerouslySetInnerHTML`
 * — so this is XSS-safe by construction: a message containing literal
 * `<script>` (or any other markup) is inserted as a text node and can never
 * become live DOM, the same way React already escapes any other string
 * child. Only `http:`/`https:` link targets are converted to a live anchor;
 * a `[text](url)` whose scheme is anything else (`javascript:`, `data:`, a
 * malformed URL, ...) is left as inert literal text, brackets included.
 */

/** Matches `[text](url)` — text may not contain `[`/`]`, url may not contain
 *  whitespace or parens (good enough for the one syntax this app produces;
 *  see the Addlink Box, the only writer of this pattern). */
const MARKDOWN_LINK_PATTERN = /\[([^[\]]+)\]\(([^\s()]+)\)/g;

function isSafeHref(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function renderKudoMessage(message: string): ReactNode[] {
  const matches = Array.from(message.matchAll(MARKDOWN_LINK_PATTERN));

  const { parts, lastIndex } = matches.reduce<{ parts: ReactNode[]; lastIndex: number }>(
    (acc, match, index) => {
      const [full, text, url] = match;
      const matchIndex = match.index ?? 0;
      const nextParts =
        matchIndex > acc.lastIndex ? [...acc.parts, message.slice(acc.lastIndex, matchIndex)] : [...acc.parts];

      // Only http/https targets become a live anchor; anything else
      // (javascript:, data:, a malformed URL) stays inert literal text.
      const node = isSafeHref(url) ? (
        <a key={`kudo-link-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="underline">
          {text}
        </a>
      ) : (
        full
      );

      return { parts: [...nextParts, node], lastIndex: matchIndex + full.length };
    },
    { parts: [], lastIndex: 0 },
  );

  return lastIndex < message.length ? [...parts, message.slice(lastIndex)] : parts;
}
