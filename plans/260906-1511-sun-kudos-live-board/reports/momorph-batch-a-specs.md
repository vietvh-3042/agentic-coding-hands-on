# MoMorph Batch A — consolidated behavioral spec (6 screens)

fileKey `9ypp4enmFmdK3YAFJLIu6C` ("SAA 2025 - Internal Live Coding"). All frames `design_status=done, spec_status=done, dev_status=none`.

Raw downloads (verbatim):

| #   | Screen                   | screenId   | specs | testcases          | saved under                                    |
| --- | ------------------------ | ---------- | ----- | ------------------ | ---------------------------------------------- |
| 3   | Sun* Kudos - Live board  | MaZUn5xHXZ | 64    | 41                 | `plans/260710-1511-sun-kudos-live-board/data/` |
| 7   | Dropdown Hashtag filter  | JWpsISMAaM | 4     | **0 (none exist)** | `plans/260713-1046-shared-saa-hashtags/data/`  |
| 11  | Dropdown list hashtag    | p9zO-c4a4x | 10    | **0 (none exist)** | `plans/260713-1046-shared-saa-hashtags/data/`  |
| 9   | Viết Kudo                | ihQ26W78P2 | 26    | 57                 | `plans/260709-1540-kudos-write-form/data/`     |
| 10  | Addlink Box              | OyDLDuSGEa | 10    | 25                 | `plans/260709-1540-kudos-write-form/data/`     |
| 12  | Open secret box- chưa mở | J3-4YFIpMM | 4     | 19                 | `plans/260713-1723-open-secretbox/data/`       |

No `-testcases.csv` written for JWpsISMAaM / p9zO-c4a4x — MCP returned `status: empty`, not an error. Nothing fabricated.

---

## 1. Per screen — purpose + interactive elements

### MaZUn5xHXZ — Sun* Kudos Live board

Purpose: the public event board — KV banner, write-kudos entry bar, Highlight carousel (top-liked), Spotlight word cloud, All-Kudos infinite feed, right sidebar (personal stats + 2 leaderboards).

`userAction` values present (only 6 rows carry one): `on_click` on B.1.1 hashtag filter, B.1.2 department filter, D.1.8 "Mở quà"; `while_hovering` on B.3.1/B.3.5 avatars and C.3.1/C.3.3 sender/receiver info blocks. `transitionNote`, `validationNote`, `databaseTable/Column` are blank on every row except B/B.2.3 (`databaseTable = kudos`), B.7.3 (`maxLength=100`, `validationNote = "Tối đa 100 ký tự Không bắt buộc"`), and C.4.1 (`databaseNote`, quoted in §3).

Behavior, by item:

- **A.1 write bar** — click opens the Viết Kudo dialog. Placeholder `'Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?'`. Pill shape, pencil icon left.
- **B.1.1 Hashtag filter / B.1.2 Phòng ban filter** — click opens dropdown; select filters **both Highlight Kudos AND All Kudos**, resets carousel pagination to 1. Both lists "truy vấn từ cơ sở dữ liệu". Clearing shows all; empty state handled.
- **B.2/B.5 carousel** — exactly **5 cards** (top-5 by hearts across the whole event). Prev disabled on slide 1, Next disabled on slide 5. Page indicator `'2/5'`. Center card prominent, side cards faded and **non-interactive**.
- **B.3 highlight card / C.3 feed card** — click card or content → kudos detail page. `'Xem chi tiết'` (highlight only) → detail. `'Copy Link'` → clipboard + toast. Heart → toggle like.
- **B.3.2 / B.3.6 / C.3.1 / C.3.3 person blocks** — click name or avatar → profile page; hover → profile preview; hover the "hoa thị" (star) count → tooltip with the tier text (quoted §3).
- **B.4.3 / C.3.7 / D.4 hashtag chips** — clicking a chip **sets the Hashtag filter to that tag** and re-filters both Highlight and All Kudos.
- **C.3.6 gallery** — max 5 thumbnails, horizontal, left-aligned; click → full-size image.
- **C.4.1 heart** — full business rules in §3.
- **B.7 Spotlight** — word cloud of recipient names. Hover node → tooltip (name + time received). Click node → that kudos' detail. B.7.2 Pan/Zoom toggles pan↔zoom mode, hover tooltip `'Pan/Zoom'`. B.7.1 shows total system kudos count `'388 KUDOS'` queried from DB. B.7.3 search input, placeholder `'Tìm kiếm'`, max 100 chars, optional; Enter or magnifier icon triggers search.
- **D.1.8 "Mở quà"** — opens the Secret Box dialog; may be disabled when not eligible.
- **D sidebar** — scrolls independently. D.3 leaderboards: click avatar/name → profile, hover → preview, scrolls when overflowing.

### JWpsISMAaM — Dropdown Hashtag filter (the board's filter menu)

Purpose: the menu behind B.1.1 on the live board. **Single-select.** Click an item → select value, **close the dropdown**, apply the filter to the whole page. List scrolls past its height. Selected row: dark raised background + bright text. A.1 additionally says "toggle chọn/bỏ chọn" (so re-clicking the selected tag clears it). No `userAction`/`transitionNote`/`validationNote` on any row.

Spec lists **13 hashtags, in Vietnamese**: Toàn diện, Giỏi chuyên môn, Hiệu suất cao, Truyền cảm hứng, Cống hiến, Aim High, Be Agile, Wasshoi, Hướng mục tiêu, Hướng khách hàng, Chuẩn quy trình, Giải pháp sáng tạo, Quản lý xuất sắc.

### p9zO-c4a4x — Dropdown list hashtag (the write-form picker)

Purpose: the menu behind "+ Hashtag" in Viết Kudo. **Multi-select, max 5.** Every row carries `userAction: on_click`.

- Row click toggles select/deselect. Selected → dark bg + `'✓'` in a 24x24 circle; unselected → light bg, blank 24x24 spacer (layout stable).
- `transitionNote` (A/B/C): `"Toggle trạng thái chọn/bỏ chọn; dấu check hiện/ẩn; nền tối ↔ sáng; hover làm nổi nền nhẹ"`.
- `transitionNote` (A.1/B.1/C.1): `"Toggle chọn/bỏ chọn hashtag; disable các mục chưa chọn khi tổng đạt 5"`.
- `transitionNote` (D, unselected row): `"Click chọn hashtag — icon check xuất hiện; nền chuyển tối; hover làm nổi nền nhẹ; bị disable khi đủ 5 lựa chọn"`.
- Hashtag list is **"load dynamic từ DB"** (A.1 description, explicit).
- Names shown: #High-perorming _(sic, typo in spec)_, #BE PROFESSIONAL, #BE OPTIMISTIC, #Be A Team, #THINK OUTSIDE THE BOX, #GET RISKY, #GO FAST, #WASSHOI — **8, in English**.

### ihQ26W78P2 — Viết Kudo (write modal)

Purpose: compose + submit a kudos. Field order: Người nhận → editor toolbar → textarea → Hashtag → Image → anonymous checkbox → footer (Hủy / Gửi).

- **B/B.2 Người nhận** — required, autocomplete over Sunners, min 1 char, must resolve to an existing Sunner; input trims surrounding whitespace; select fills the field and closes the dropdown. Empty → red border + message.
- **C.1–C.6 toolbar** — Bold, Italic, Strikethrough, Numbered list, Link, Quote. C.5 Link: "Mở hộp thoại nhập URL và tùy chọn mở trong tab mới" → **this is the Addlink Box screen (OyDLDuSGEa)**.
- **D textarea** — required. `'@' + name` mention autocomplete. Placeholder `'Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!'`. Hint line D.1 always visible.
- **E/E.2 Hashtag** — required, **min 1, max 5**. "+ Hashtag" opens the p9zO-c4a4x dropdown; chips have an `x` to remove.
- **F Image** — optional, **max 5**. "+ Image" opens the file picker; the button **hides** at 5 and reappears after a removal. Accepted: .jpg / .png. Rejected with an error: .pdf, .mp4, .txt.
- **G anonymous checkbox** — default unchecked; checking **reveals a text field for the anonymous display name**; unchecking hides it.
- **H.1 Hủy** — always enabled; closes and discards.
- **H.2 Gửi** — **disabled until Người nhận + nội dung + ≥1 hashtag are all filled**. On click: validate → loading → close on success.

Note: D.1's nameJP/nameTrans says "Gợi ý và bộ đếm ký tự" (hint + **character counter**) but the description only defines the hint text. No min/max length is given for the message anywhere. See §8.

### OyDLDuSGEa — Addlink Box

Purpose: the URL-insert dialog opened from the editor's link button. Two fields + Hủy/Lưu.

- **B/B.2 Text** — required, **1–100 chars**, whitespace-only rejected. Label click focuses the input; focus shows a highlight border.
- **C Link** — required, `format: url`, **5–2048 chars**, http/https. **Validated on blur** as well as on save.
- **D.1 Hủy** — closes without saving; **ESC also closes**; double-click is harmless.
- **D.2 Lưu** — validates; on success saves and closes; on error keeps the modal open with per-field errors.
- Only one modal instance may be open at a time.
- Spec inconsistency: C.2 duplicates the "Text" label but carries the _Link_ constraints (`minLength 5`, `maxLength 2046`, validationNote says 5–2048). C is authoritative; C.2 looks like a copy-paste artifact.

### J3-4YFIpMM — Open secret box (chưa mở)

Purpose: the Secret Box modal reached from sidebar "Mở quà". Title is `'MỞ SECRET BOX THÀNH CÔNG'` — the frame is named "chưa mở" but it is **the success/reveal modal**, not a pre-open teaser.

- **B instruction line** — `'Click vào box để tiếp tục mở'`; **hidden when unopened count = 0**.
- **C box image** — click awards **exactly one random badge**, decrements unopened count by 1, modal refreshes with the new badge. **Click disabled when unopened count = 0.** Probabilities: Stay Gold 30%, Flow to Horizon 25%, Beyond the Boundary 10%, Root Further 5%, Touch of Light 20%, Revival 10%.
- **D counter** — label `'Secretbox chưa mở'` + number (design sample `'04'`), read-only, always from backend.
- Close via the `X` at top right.
- Access gate: modal opens **only** for a logged-in, entitled user **with unopened boxes > 0**. All other cases: denied / unavailable / redirect.
- Both the badge and the counter are explicitly **server-authoritative** (client tampering must be ignored, invalid badge id → fallback image, no script execution).

---

## 2. Data requirements per screen

**MaZUn5xHXZ — READ**

- Feed kudos (`kudos` table named on B / B.2.3): sender {avatar (Gmail), full name, department, star count, badge/danh hiệu}, receiver {same}, `created_at` rendered `HH:mm - MM/DD/YYYY`, rich message body, up to 5 attachment image URLs, hashtag list, heart count, plus **`liked_by_me`** and **`is_own_kudos`** (needed for the heart's disabled/active state), and the kudos permalink URL.
- Highlight: top **5** kudos ordered by heart count desc, over the whole event, honoring the active hashtag + department filters.
- Hashtag list (from DB) and department list (from DB) for the two filter dropdowns.
- Spotlight: recipient nodes {display name, time received} + **total system kudos count** (the "388").
- Star-tier thresholds: 10 / 20 / 50 received kudos → 1 / 2 / 3 stars.
- Sidebar stats for the current user: kudos received, kudos sent, hearts received, secret boxes opened, secret boxes unopened.
- Two leaderboards, 10 rows each: "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" (latest rank-ups) and "10 SUNNER NHẬN QUÀ MỚI NHẤT" (latest gift recipients: avatar, name, prize description e.g. `'Nhận được 1 áo phông SAA'`, sourced from prize-draw results).
- Sunner search by keyword (Spotlight search bar).

**MaZUn5xHXZ — WRITE**

- Toggle heart on a kudos (insert/delete one like row per user per kudos; adjust the _sender's_ heart balance by +1, or +2 on an admin-configured special day; revoke the same amount on unlike — so the like row must record which multiplier it granted).

**JWpsISMAaM / p9zO-c4a4x — READ**: the hashtag master list from DB. **WRITE**: nothing. Both are pure selection UI; the selection is client state consumed by the filter or the write form.

**ihQ26W78P2 — READ**: Sunner directory for recipient autocomplete and for `@` mentions (id, display name, avatar); hashtag master list. **WRITE**: one kudos row {sender_id, receiver_id, rich-text body, mentions[], hashtags[] (1–5), image URLs[] (0–5), is_anonymous, anonymous_display_name?, created_at} plus the uploaded image blobs.

**OyDLDuSGEa — READ**: nothing. **WRITE**: nothing persistent — it returns `{text, url}` into the editor document.

**J3-4YFIpMM — READ**: current user's unopened secret-box count and the badge awarded by the last open. **WRITE**: open one secret box → server draws the badge by the fixed probability table, records the award, decrements unopened count. Must be a server call; the draw cannot be client-side.

---

## 3. Validation rules and error/message strings (verbatim — i18n key candidates)

Placeholders and static copy:

- `'Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?'` (write bar)
- `'Tìm kiếm'` (Spotlight Sunner search; also the recipient field placeholder)
- `'Hệ thống ghi nhận lời cảm ơn'` (KV banner title), logo `'SAA 2025 KUDOS'`
- `'Sun* Annual Awards 2025'`, `'HIGHLIGHT KUDOS'`, `'ALL KUDOS'`, `'SPOTLIGHT BOARD'`
- `'Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!'` (message textarea)
- `'Bạn có thể “@ + tên” để nhắc tới đồng nghiệp khác'` (editor hint, note the curly quotes)
- `'Gửi lời cám ơn và ghi nhận đến đồng đội'` (write modal title)
- `'Gửi lời cám ơn và ghi nhận ẩn danh'` (anonymous checkbox)
- `'Người nhận'`, `'Hashtag'`, `'Tối đa 5'`, `'+ Hashtag'`, `'Image'`, `'+ Image'`, `'Hủy'`, `'Gửi'`
- `'Add link'`, `'Text'`, `'Link'`, `'Lưu'`
- `'MỞ SECRET BOX THÀNH CÔNG'`, `'Click vào box để tiếp tục mở'`, `'Secretbox chưa mở'`
- `'Số Kudos bạn nhận được:'`, `'Số Kudos bạn đã gửi:'`, `'Số tim bạn nhận được:'`, `'Số Secret Box bạn đã mở:'`, `'Số Secret Box chưa mở:'`, `'Mở quà'`
- `'10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT'`, `'10 SUNNER NHẬN QUÀ MỚI NHẤT'`, sample `'Nhận được 1 áo phông SAA'`
- `'Copy Link'`, `'Xem chi tiết'`, `'Pan/Zoom'`, `'388 KUDOS'`

Toast / empty / error strings:

- `'Link copied — ready to share!'` — copy-link toast (English in both locales, as written in the spec)
- `'Hiện tại chưa có Kudos nào.'` — empty Highlight card and empty All-Kudos feed
- `'Chưa có dữ liệu'` — empty sidebar leaderboard
- `'Không được để trống'` — required error for Người nhận, message textarea, and Hashtag (Viết Kudo)
- `'Tối đa 5 hashtag'` — attempting a 6th hashtag

Star-tier tooltip text (verbatim, hovering the hoa thị count):

- 1 hoa thị: `Sunner đã nhận được 10 Kudos và bắt đầu lan tỏa năng lượng ấm áp đến mọi người xung quanh.`
- 2 hoa thị: `Sunner đã nhận được 20 Kudos và chứng minh sức ảnh hưởng của mình qua những hành động lan tỏa tích cực mỗi ngày.`
- 3 hoa thị: `Sunner đã nhận được 50 Kudos và trở thành hình mẫu của sự công nhận, sẻ chia và lan tỏa tinh thần Sun*.`

Field constraints (`validationNote` verbatim):

- Spotlight search (B.7.3): `Tối đa 100 ký tự Không bắt buộc` — 101 chars rejected with an error; empty search blocked with a required message.
- Recipient (B.2): `Trường bắt buộc Chọn người nhận từ danh sách (autocomplete) Tối thiểu 1 ký tự`
- Message (D): `Cho phép '@' + tên để nhắc đồng nghiệp Bắt buộc`
- Hashtag (E): `Tối thiểu 1 tag. Tối đa 5 hashtag Trường bắt buộc`
- Image (F): `Tối đa 5 ảnh`
- Addlink Text (B / B.2): `Độ dài 1-100 ký tự Trường bắt buộc Không chỉ gồm khoảng trắng` / `Bắt buộc, không gồm chỉ khoảng trắng`
- Addlink Link (C): `Định dạng URL hợp lệ (http/https) Độ dài 5-2048 ký tự Trường bắt buộc`
- Hashtag dropdown rows (p9zO A.1): `Condition: Số hashtag đã chọn >= 5 Error: Không cho phép chọn thêm hashtag mới (disable các mục chưa chọn)`; row D: `Condition: Số hashtag đã chọn >= 5 Error: Item bị disable — không phản hồi click`

Heart business rules (C.4.1 description, verbatim in the CSV):

1. Mỗi người dùng chỉ có một lượt thả tim duy nhất cho 1 một kudos.
2. Người gửi kudos sẽ bị disable nút tim (không thể thả tim cho kudos của chính mình gửi).
3. Ứng với 1 lượt thả tim trên kudos, tài khoản gửi lời cảm ơn sẽ được cộng 1 tim.
4. Nếu lượt thả tim diễn ra trong những ngày đặc biệt (do admin cấu hình) thì tài khoản gửi kudos sẽ được cộng 2 tim.
5. Người dùng có thể hủy bỏ lượt thả tim. Số tim trên tài khoản nhận kudos sẽ bị thu hồi tương ứng 1 tim hoặc 2 tim.

`databaseNote` on C.4.1 (verbatim): `Cần phân biệt lượt thả tim bình thường và lượt thả tim đặc biệt (thả trong ngày đặc biệt do admin set) để thu hồi đúng số tim đã cộng cho người nhận kudo.`

Other rules:

- Message body truncation: **3 lines** in the Highlight card, **5 lines** in the feed card, then `...`.
- Hashtag chips: max 5 on one line, then `...`.
- Attachments: max 5 thumbnails.
- Auth: unauthenticated users may see the board but any profile/detail navigation redirects to login or shows an auth prompt.

---

## 4. Empty / loading / error states

| State                            | Where                                      | Copy / behavior                                                                              |
| -------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Empty feed                       | All Kudos list (C.2), Highlight card (B.3) | `'Hiện tại chưa có Kudos nào.'`                                                              |
| Empty leaderboard                | Sidebar lists (D)                          | `'Chưa có dữ liệu'`                                                                          |
| Spotlight loading                | B.7                                        | loading indicator                                                                            |
| Spotlight empty                  | B.7                                        | empty-state message (text not specified)                                                     |
| Spotlight interactive            | B.7                                        | nodes rendered, hover/click/pan/zoom live                                                    |
| Filter cleared → nothing matches | both filter dropdowns                      | "empty state is handled" (text not specified)                                                |
| Carousel ends                    | B.5                                        | prev disabled at slide 1, next disabled at slide 5                                           |
| Submitting                       | Viết Kudo "Gửi"                            | show loading, then close on success                                                          |
| Form errors                      | Viết Kudo                                  | red border + `'Không được để trống'`, all invalid fields flagged at once                     |
| Bad file type                    | Image upload                               | error message, file not uploaded                                                             |
| Addlink errors                   | Add link modal                             | per-field errors, modal stays open                                                           |
| Secret box, 0 unopened           | J3-4YFIpMM                                 | instruction line hidden, box click disabled, modal does not open at all from the entry point |
| Secret box, bad badge data       | J3-4YFIpMM                                 | fallback/default image, no crash, no script execution                                        |
| "Mở quà" ineligible              | sidebar D.1.8                              | button may render disabled                                                                   |

---

## 5. Pagination / infinite scroll / limits (query shape)

- **All Kudos feed: infinite scroll** ("Pagination / scroll: infinity scroll") → cursor/keyset pagination. The specs never state the sort key or page size. Newest-first is the obvious reading but **is not written anywhere** — see §8.
- **Highlight carousel: hard limit 5**, ordered by heart count desc, whole-event window, filter-aware, pagination indicator `n/5`, resets to page 1 whenever a filter changes.
- **Leaderboards: exactly 10 rows each**, "mới nhất" → ordered by event time desc.
- **Spotlight: total count is a single aggregate** over all kudos; node set is all kudos recipients (no limit given) — needs its own bounded/lazy query, this is the riskiest one at scale.
- Per-record caps that shape the payload: ≤5 attachments, ≤5 hashtags, 1 recipient.
- Search: Sunner keyword search, ≤100 chars, non-empty required.
- Filters are **AND-composed across sections**: one hashtag + one department, applied to Highlight and All Kudos simultaneously.

---

## 6. Cross-screen shared concerns

**The two hashtag dropdowns are NOT the same component and their spec data does NOT match.** Stated plainly:

|              | JWpsISMAaM (board filter)                                                       | p9zO-c4a4x (write form)                                               |
| ------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Selection    | single-select, closes on pick                                                   | multi-select, stays open                                              |
| Limit        | none                                                                            | max 5, unselected rows disabled at 5                                  |
| Check icon   | none                                                                            | 24x24 `'✓'` circle                                                    |
| List in spec | **13 items, Vietnamese**                                                        | **8 items, English**                                                  |
| Source       | "Danh sách hashtag được truy vấn từ cơ sở dữ liệu" (stated on MaZUn5xHXZ B.1.1) | "danh sách hashtag được lấy dynamic từ database" (stated on p9zO A.1) |

Both claim the **same origin — the DB hashtag table** — so they _should_ be one data source, but the two spec sheets were authored from different snapshots (13 VI names vs 8 EN names, no overlap in casing or wording). This is a real content conflict that must be resolved with the designer/BA before the hashtag table is seeded. Interaction models legitimately differ; **the list must not.**

Other shared concerns:

- **Copy-link toast** `'Link copied — ready to share!'` is identical on the highlight card and the feed card — one shared hook.
- **Person block** (avatar + name + department + stars + badge, click→profile, hover→preview, star hover→tier tooltip) repeats in highlight card, feed card, and both leaderboards — one component.
- **Hashtag chip click** behaves identically on highlight cards, feed cards and the D.4 category chip: it _writes_ the global hashtag filter. So filter state must live above both sections (page-level), not inside FeedList.
- **Heart** appears on both card types with the same rules and the same server mutation.
- **Kudos detail page** is the click target from highlight card, feed card content, "Xem chi tiết", and Spotlight nodes — one route, four entry points. **No detail-screen spec is in this batch.**
- **Secret box** is reached from sidebar D.1.8; J3-4YFIpMM is that dialog.
- **Add link** is reached only from the Viết Kudo editor's C.5 button; it has no other entry point.
- Auth gate is uniform: view is public, any profile/detail/action requires login.

---

## 7. Component coverage + what the existing implementation must change

Coverage of the 6 screens:

| Screen         | Existing component                                               | Verdict                                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MaZUn5xHXZ     | `components/kudos-board/*` (23 files) + `app/sun-kudos/page.tsx` | present, near-complete                                                                                                                                                                                                       |
| JWpsISMAaM     | `components/kudos-board/highlight-filter-dropdown.tsx`           | present, single-select — correct model                                                                                                                                                                                       |
| p9zO-c4a4x     | `components/kudos/kudos-hashtag-input.tsx`                       | present, multi-select max 5 with check icon + disable-at-5 — correct model                                                                                                                                                   |
| ihQ26W78P2     | `components/kudos/kudos-form-modal.tsx` + 4 field components     | present                                                                                                                                                                                                                      |
| **OyDLDuSGEa** | **none**                                                         | **MISSING — confirmed.** `kudos-content-editor.tsx:10-19` renders a `link` toolbar button with no handler at all; the whole toolbar is documented as "presentational/no-op". No Add-link dialog exists anywhere in the tree. |
| J3-4YFIpMM     | `components/kudos-board/sidebar-gift-dialog.tsx`                 | present but **only the closed state**                                                                                                                                                                                        |

Concrete changes the specs demand:

1. **`constants/index.ts:6` `SAA_HASHTAGS` is a hardcoded 8-item English list.** Both dropdown specs say the list comes from the DB. It must become a query. And the 8 labels match p9zO but contradict JWpsISMAaM's 13 Vietnamese names — resolve before seeding. `DEPARTMENTS` (4 hardcoded CEVC rows) has the same problem: MaZUn5xHXZ B.1.2 says departments are queried from the DB.
2. **`sidebar-gift-dialog.tsx` implements only the not-yet-opened state** (its own doc comment says "The open/reveal flow (random badge) lives in separate frames and is out of scope here"). J3-4YFIpMM is _the reveal modal_ — title `'MỞ SECRET BOX THÀNH CÔNG'`, click-to-open, server-side random badge with the 6-way probability table, count decrement, refresh with the new badge. That flow must be added, and the draw must be server-side (two explicit security test cases forbid client-side manipulation of both the badge and the counter).
3. **Heart is local-only state.** `feed-kudo-post-card.tsx:28-33` and `highlight-kudo-card.tsx:63-65` derive the count from a local `liked` boolean. Missing: the sender's own-kudos disable, one-like-per-user server enforcement, the sender's +1/+2 heart credit, the special-day multiplier, and correct revocation of whichever amount was granted. Needs a `likes` table recording the multiplier used.
4. **`kudos-content-editor.tsx` toolbar is entirely no-op.** All six buttons need real behavior; the link button specifically must open the new Addlink Box, and the message body must become rich text (the feed card spec expects formatted content), plus `@`-mention autocomplete (D) which does not exist today.
5. **Anonymous send is missing the name field.** Check `kudos-form-modal.tsx` against spec G: checking the box must reveal a text input for the anonymous display name.
6. **`feed-list.tsx` owns hashtag filter state locally** (`useState(selectedHashtag)` at line 26) and filters only the feed. Spec: a hashtag click must re-filter **both** Highlight and All Kudos, and reset the carousel to page 1. State must be lifted to the page.
7. **Infinite scroll runs over a fixed mock page count** (`KUDO_POSTS_TOTAL_PAGES`) — replace with a real cursor query.
8. **`highlight-filter-dropdown.tsx` filters nothing outside itself** and the department filter has no wiring to the feed; per spec both filters drive Highlight _and_ All Kudos.
9. **Mock data to retire**: `components/kudos-board/{feed,highlight,spotlight}-mock-data.ts`, `components/kudos/kudos-mock-data.ts` (8 fake Sunners for the recipient autocomplete — must become a real Sunner directory query, which the `@`-mention feature also needs).
10. **Spotlight count is mock**; B.7.1 requires a real `COUNT(*)` of all kudos.
11. **Truncation limits**: verify the highlight card truncates at 3 lines and the feed card at 5 — the specs give different numbers for the two cards.
12. **Star tiers (10/20/50) and the badge/danh hiệu** are display-only in the current components; the tier tooltip text and thresholds are business data that must come from the received-kudos count.

---

## 8. Unresolved questions

1. **Hashtag master list: 13 Vietnamese (JWpsISMAaM) or 8 English (p9zO-c4a4x)?** No overlap in wording. Blocking for the DB seed and for i18n. Also, p9zO's `#High-perorming` is a typo in the spec itself.
2. **Feed sort order is never stated.** "Infinity scroll" only. Newest-first assumed but unconfirmed; and no page size is given.
3. **Message body length limits are missing.** D.1 is named "Gợi ý và bộ đếm ký tự" (hint _and character counter_) but no min/max is anywhere in the spec, and the counter itself is never described.
4. **Addlink C.2 contradicts C** — same label "Text", but Link's constraints (`min 5`, `max 2046`, note says 2048). Treated C as authoritative; confirm C.2 is a duplication error.
5. **Which "special days" grant 2 hearts, and how are they configured?** Spec says "do admin cấu hình" — no admin screen in this batch.
6. **"Mở quà" disabled condition** — C says "có thể disabled nếu không đủ điều kiện" without naming the condition. Probably `unopened === 0`, unconfirmed.
7. **Spotlight empty-state and filter-empty copy** are not given as literal strings (unlike the feed/leaderboard ones).
8. **Kudos detail page has no spec in this batch** — four different elements navigate to it.
9. **Anonymous kudos vs. the heart credit rule**: rule 3 credits "tài khoản gửi". If the sender is anonymous, who is shown and who is credited?
10. **Rich-text storage format** for the message (spec has bold/italic/strike/list/link/quote + mentions) — HTML, Markdown, or a JSON doc? Not specified.
11. **JWpsISMAaM A.1 says "toggle"** while A/A.3 say "select and close". Is re-clicking the active filter tag a clear-filter action? Read as yes.
12. **Image upload constraints beyond type** — no max file size, no dimension limits in the spec.
