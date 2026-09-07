import { test, expect, type Page, type Locator } from "@playwright/test";
import { psql } from "../support/psql";

/**
 * Message-render regression suite (reviewer inspection Critical #1 / High
 * #2, `plans/260710-1511-sun-kudos-live-board/reports/
 * reviewer-260906-2240-batch-a-inspection.md`). Confirms the board renders a
 * kudo's message as safe, literal content: no leftover `<p>`/`</p>` wrapper,
 * a valid `[text](url)` markdown link becomes a real anchor, and an unsafe
 * payload (`<script>`, a `javascript:` "link") stays inert text — never live
 * markup or a live link. Every assertion here checks exact rendered
 * structure, not a `getByText` substring match — the class of assertion the
 * inspection report named as the reason this slipped past 37/37 green twice.
 *
 * Runs in `chromium-authed` (seeded admin identity, id …0001).
 */

const SENDER_ID = "00000000-0000-4000-8000-000000000001";

async function openKudoForm(page: Page): Promise<Locator> {
  await page.goto("/sun-kudos");
  await page.getByText("Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?").click();
  return page.getByRole("dialog", { name: "Gửi lời cám ơn và ghi nhận đến đồng đội" });
}

async function pickRecipient(dialog: Locator, name: string) {
  await dialog.getByPlaceholder("Tìm kiếm").fill(name);
  await dialog.getByRole("option", { name }).click();
}

async function addOneHashtag(dialog: Locator) {
  await dialog.getByRole("button", { name: /Hashtag/ }).click();
  await dialog.getByRole("option", { name: "#Toàn diện" }).click();
}

async function submitAndFindCard(page: Page, dialog: Locator): Promise<Locator> {
  // "Danh hiệu" is required (Frame 552's `*`) and gates "Gửi"; this suite is
  // about how the MESSAGE renders, so any valid title will do.
  await dialog.getByPlaceholder("Dành tặng một danh hiệu cho đồng đội").fill("Nguoi truyen dong luc cho toi");
  await dialog.getByRole("button", { name: "Gửi" }).click();
  await expect(page.getByText("Đã gửi lời cảm ơn thành công!")).toBeVisible();
  await expect(dialog).toBeHidden();

  const kudoId = psql(`select id from public.kudos where sender_id = '${SENDER_ID}' order by created_at desc limit 1;`);
  await page.goto("/sun-kudos");
  const card = page.getByTestId("feed-list").locator(`[data-kudo-id="${kudoId}"]`);
  await expect(card).toBeVisible();
  return card;
}

test.describe.configure({ mode: "serial" });

test.describe("Kudo message rendering — safe by construction", () => {
  test("no seeded or freshly-submitted card ever shows the literal <p>/</p> wrapper", async ({ page }) => {
    await page.goto("/sun-kudos");
    const messages = page.getByTestId("kudo-message");
    const count = await messages.count();
    expect(count).toBeGreaterThan(0);

    const texts = await messages.evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ""));
    texts.forEach((text) => {
      expect(text).not.toContain("<p>");
      expect(text).not.toContain("</p>");
    });
  });

  test("a message written through the write form renders with no <p> wrapper", async ({ page }) => {
    const dialog = await openKudoForm(page);
    await pickRecipient(dialog, "Andrew Nelson");
    await dialog.getByPlaceholder(/Hãy gửi gắm/).fill("Cam on ban da ho tro team rat nhieu trong sprint vua qua!");
    await addOneHashtag(dialog);

    const card = await submitAndFindCard(page, dialog);
    const messageText = ((await card.getByTestId("kudo-message").textContent()) ?? "").trim();
    expect(messageText).toBe("Cam on ban da ho tro team rat nhieu trong sprint vua qua!");
  });

  test("a valid [text](url) link inserted via the Addlink Box renders as a real, safe anchor", async ({ page }) => {
    const dialog = await openKudoForm(page);
    await pickRecipient(dialog, "Andrew Nelson");
    await dialog.getByPlaceholder(/Hãy gửi gắm/).fill("Xem thêm: ");
    await dialog.getByRole("button", { name: "Chèn liên kết" }).click();
    const addlinkDialog = page.getByRole("dialog", { name: "Add link" });
    await addlinkDialog.locator("#addlink-text").fill("Sample Link");
    await addlinkDialog.locator("#addlink-url").fill("https://www.example.com");
    await addlinkDialog.getByRole("button", { name: "Lưu" }).click();
    await addOneHashtag(dialog);

    const card = await submitAndFindCard(page, dialog);
    const link = card.getByTestId("kudo-message").getByRole("link", { name: "Sample Link" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "https://www.example.com");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("a <script> payload and a javascript: link both render as inert literal text, never live markup", async ({
    page,
  }) => {
    const dialog = await openKudoForm(page);
    await pickRecipient(dialog, "Andrew Nelson");
    const payload = "<script>window.xssMarkerTriggered = true;</script> [Click](javascript:alert(1))";
    await dialog.getByPlaceholder(/Hãy gửi gắm/).fill(payload);
    await addOneHashtag(dialog);

    let dialogFired = false;
    page.on("dialog", () => {
      dialogFired = true;
    });

    const card = await submitAndFindCard(page, dialog);
    const messageBox = card.getByTestId("kudo-message");

    await expect(page.locator("script", { hasText: "xssMarkerTriggered" })).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { xssMarkerTriggered?: boolean }).xssMarkerTriggered),
    ).toBeUndefined();
    expect(dialogFired).toBe(false);

    const messageText = (await messageBox.textContent()) ?? "";
    expect(messageText).toContain("<script>window.xssMarkerTriggered = true;</script>");
    expect(messageText).toContain("[Click](javascript:alert(1))");

    await expect(messageBox.locator('a[href^="javascript:"]')).toHaveCount(0);
  });
});
