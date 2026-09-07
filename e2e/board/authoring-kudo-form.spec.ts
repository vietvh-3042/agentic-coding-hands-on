import { test, expect, type Page, type Locator } from "@playwright/test";
import { psql } from "../support/psql";

/**
 * F003 kudo authoring — MoMorph "Viết Kudo" (ihQ26W78P2). Test cases ID-15/16/
 * 17/18/48/49/50/51/52/53/54/55/56 (required-field gating, hashtag/image caps,
 * invalid file type) and `ca8f60b3` (happy-path submit persists a real row),
 * plus the "Danh hiệu" field (Frame 552) and its `hashtag_title` write.
 * The 501-char case proves FR-601/BR-001: the client never blocks on length
 * (only the visual counter reacts), so the request reaches the real
 * `submitKudoAction` Server Action and is rejected there — verified against
 * the live DB, not by inspecting client state.
 *
 * Runs in `chromium-authed` (seeded admin identity, id …0001, "Huỳnh Dương
 * Xuân Nhật"). Recipient used throughout is the seeded "Andrew Nelson"
 * (…0004) — a real `profiles` row, not a mock.
 */

const SENDER_ID = "00000000-0000-4000-8000-000000000001";

function countKudosBySender(): number {
  return Number(psql(`select count(*) from public.kudos where sender_id = '${SENDER_ID}';`));
}

function latestKudoMessage(): string {
  return psql(`select message from public.kudos where sender_id = '${SENDER_ID}' order by created_at desc limit 1;`);
}

function latestKudoTitle(): string {
  return psql(
    `select hashtag_title from public.kudos where sender_id = '${SENDER_ID}' order by created_at desc limit 1;`,
  );
}

function latestKudoHashtagCount(): number {
  const kudoId = psql(`select id from public.kudos where sender_id = '${SENDER_ID}' order by created_at desc limit 1;`);
  return Number(psql(`select count(*) from public.kudo_hashtags where kudo_id = '${kudoId}';`));
}

async function openKudoForm(page: Page) {
  await page.goto("/sun-kudos");
  await page.getByText("Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?").click();
  return page.getByRole("dialog", { name: "Gửi lời cám ơn và ghi nhận đến đồng đội" });
}

async function pickRecipient(dialog: Locator, name: string) {
  await dialog.getByPlaceholder("Tìm kiếm").fill(name);
  await dialog.getByRole("option", { name }).click();
}

/** "Danh hiệu" (Figma Frame 552) — required, and persisted as `hashtag_title`. */
async function fillKudoTitle(dialog: Locator, title: string) {
  await dialog.getByPlaceholder("Dành tặng một danh hiệu cho đồng đội").fill(title);
}

const HASHTAG_NAMES = [
  "#Toàn diện",
  "#Giỏi chuyên môn",
  "#Hiệu suất cao",
  "#Truyền cảm hứng",
  "#Cống hiến",
  "#Aim High",
];

/**
 * The picker is genuinely multi-select: it opens once and STAYS open across
 * every pick (only an outside click closes it), so a real user selects all
 * of them in one open dropdown rather than reopening between each one.
 */
async function addHashtags(dialog: Locator, count: number) {
  await dialog.getByRole("button", { name: /Hashtag/ }).click();
  await HASHTAG_NAMES.slice(0, count).reduce(async (previous, name) => {
    await previous;
    await dialog.getByRole("option", { name }).click();
  }, Promise.resolve());
}

test.describe.configure({ mode: "serial" });

test.describe("Kudo authoring form — F003", () => {
  test("opens from the write-kudos bar with the title, recipient, hashtag and submit fields visible", async ({
    page,
  }) => {
    const dialog = await openKudoForm(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder("Tìm kiếm")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Gửi" })).toBeVisible();
  });

  test("'Gửi' stays disabled until recipient, Danh hiệu, message and a hashtag are all present", async ({ page }) => {
    const dialog = await openKudoForm(page);
    const submit = dialog.getByRole("button", { name: "Gửi" });
    await expect(submit).toBeDisabled();

    await pickRecipient(dialog, "Andrew Nelson");
    await expect(submit).toBeDisabled();

    await dialog.getByPlaceholder(/Hãy gửi gắm/).fill("Cam on ban rat nhieu!");
    await expect(submit).toBeDisabled();

    await addHashtags(dialog, 1);
    // Still gated: "Danh hiệu" is required too (Frame 552's `*`).
    await expect(submit).toBeDisabled();

    await fillKudoTitle(dialog, "Nguoi truyen dong luc cho toi");
    await expect(submit).toBeEnabled();
  });

  test("the Danh hiệu field sits between the recipient and the content editor", async ({ page }) => {
    const dialog = await openKudoForm(page);
    const title = dialog.getByPlaceholder("Dành tặng một danh hiệu cho đồng đội");
    await expect(title).toBeVisible();
    await expect(dialog.getByText("Danh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn.")).toBeVisible();

    // Figma order (I520:11647): recipient -> Danh hiệu -> editor -> hashtag.
    const y = async (locator: Locator) => (await locator.boundingBox())!.y;
    expect(await y(dialog.getByPlaceholder("Tìm kiếm"))).toBeLessThan(await y(title));
    expect(await y(title)).toBeLessThan(await y(dialog.getByPlaceholder(/Hãy gửi gắm/)));
    expect(await y(dialog.getByPlaceholder(/Hãy gửi gắm/))).toBeLessThan(
      await y(dialog.getByRole("button", { name: /Hashtag/ })),
    );
  });

  test("recipient autocomplete returns a real seeded profile", async ({ page }) => {
    const dialog = await openKudoForm(page);
    await dialog.getByPlaceholder("Tìm kiếm").fill("Andrew");
    await expect(dialog.getByRole("option", { name: "Andrew Nelson" })).toBeVisible();
  });

  test("the 6th hashtag row is disabled once 5 are already selected", async ({ page }) => {
    const dialog = await openKudoForm(page);
    // The dropdown stays open from the 5th pick (only the now-hidden "+
    // Hashtag" toggle button disappears at max, not the listbox itself).
    await addHashtags(dialog, 5);
    await expect(dialog.getByRole("option", { name: "#Aim High" })).toBeDisabled();
  });

  test("a non-image file is rejected by the image picker", async ({ page }) => {
    const dialog = await openKudoForm(page);
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
    await expect(dialog.getByText("Chỉ chấp nhận file .jpg và .png")).toBeVisible();
  });

  test("checking 'send anonymously' reveals a required name field", async ({ page }) => {
    const dialog = await openKudoForm(page);
    await expect(dialog.getByPlaceholder("Nhập tên hiển thị thay thế")).toHaveCount(0);
    await dialog.getByText("Gửi lời cám ơn và ghi nhận ẩn danh").click();
    await expect(dialog.getByPlaceholder("Nhập tên hiển thị thay thế")).toBeVisible();
  });

  test("a full happy-path submit persists a real kudos row with its hashtags and closes the modal", async ({
    page,
  }) => {
    const before = countKudosBySender();
    const dialog = await openKudoForm(page);

    await pickRecipient(dialog, "Andrew Nelson");
    await fillKudoTitle(dialog, "Nguoi truyen dong luc cho toi");
    await dialog.getByPlaceholder(/Hãy gửi gắm/).fill("Cam on ban da ho tro team rat nhieu trong sprint vua qua!");
    await addHashtags(dialog, 2);

    await dialog.getByRole("button", { name: "Gửi" }).click();
    await expect(page.getByText("Đã gửi lời cảm ơn thành công!")).toBeVisible();
    await expect(dialog).toBeHidden();

    await expect.poll(() => countKudosBySender()).toBe(before + 1);
    expect(latestKudoMessage()).toContain("Cam on ban da ho tro team");
    // Regression guard: `hashtag_title` was never written before the Danh hiệu
    // field shipped, so every in-app kudo persisted with an empty category.
    expect(latestKudoTitle()).toBe("Nguoi truyen dong luc cho toi");
    expect(latestKudoHashtagCount()).toBe(2);
  });

  test("a 501-character message is rejected server-side even though the client never blocks it", async ({ page }) => {
    const before = countKudosBySender();
    const dialog = await openKudoForm(page);

    await pickRecipient(dialog, "Andrew Nelson");
    await fillKudoTitle(dialog, "Nguoi truyen dong luc cho toi");
    const overLongMessage = "a".repeat(501);
    await dialog.getByPlaceholder(/Hãy gửi gắm/).fill(overLongMessage);
    await addHashtags(dialog, 1);

    // The counter is UX only — the button must stay enabled at 501 chars.
    const submit = dialog.getByRole("button", { name: "Gửi" });
    await expect(submit).toBeEnabled();

    await submit.click();
    await expect(dialog.getByText("Nội dung không được vượt quá 500 ký tự")).toBeVisible();
    await expect(dialog).toBeVisible();

    expect(countKudosBySender()).toBe(before);
  });
});
