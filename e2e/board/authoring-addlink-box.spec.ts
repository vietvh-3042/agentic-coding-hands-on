import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Addlink Box — MoMorph "Add link" (screen OyDLDuSGEa). Test cases `adb699ca`
 * (whitespace-only Text), `7d85997d` (Text 1-100 chars), `db2ca333` (invalid
 * URL format), `aad5791a` (Link 5-2048 chars), `13c491cb`/`ef4d0413` (valid
 * save inserts + closes), `48467d34` (Hủy/Escape discard). The one toolbar
 * button that never had a handler before this phase.
 *
 * Runs in `chromium-authed` (seeded admin identity).
 */

async function openKudoFormAndAddlinkBox(page: Page): Promise<{ formDialog: Locator; addlinkDialog: Locator }> {
  await page.goto("/sun-kudos");
  await page.getByText("Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?").click();
  const formDialog = page.getByRole("dialog", { name: "Gửi lời cám ơn và ghi nhận đến đồng đội" });
  await formDialog.getByRole("button", { name: "Chèn liên kết" }).click();
  const addlinkDialog = page.getByRole("dialog", { name: "Add link" });
  await expect(addlinkDialog).toBeVisible();
  return { formDialog, addlinkDialog };
}

test.describe("Addlink Box — screen OyDLDuSGEa", () => {
  test("a whitespace-only Text is blocked on save", async ({ page }) => {
    const { addlinkDialog } = await openKudoFormAndAddlinkBox(page);
    await addlinkDialog.locator("#addlink-text").fill("   ");
    await addlinkDialog.locator("#addlink-url").fill("https://example.com");
    await addlinkDialog.getByRole("button", { name: "Lưu" }).click();
    await expect(addlinkDialog.getByText("Text không được để trống")).toBeVisible();
    await expect(addlinkDialog).toBeVisible();
  });

  test("a 101-character Text is blocked on save", async ({ page }) => {
    const { addlinkDialog } = await openKudoFormAndAddlinkBox(page);
    await addlinkDialog.locator("#addlink-text").fill("a".repeat(101));
    await addlinkDialog.locator("#addlink-url").fill("https://example.com");
    await addlinkDialog.getByRole("button", { name: "Lưu" }).click();
    await expect(addlinkDialog.getByText("Text không được vượt quá 100 ký tự")).toBeVisible();
  });

  test("an invalid URL is blocked both on blur and on save", async ({ page }) => {
    const { addlinkDialog } = await openKudoFormAndAddlinkBox(page);
    await addlinkDialog.locator("#addlink-text").fill("Sample Link");
    const linkField = addlinkDialog.locator("#addlink-url");
    await linkField.fill("not-a-url");
    await linkField.blur();
    await expect(addlinkDialog.getByText("Nhập URL hợp lệ (http/https), từ 5 đến 2048 ký tự")).toBeVisible();

    await addlinkDialog.getByRole("button", { name: "Lưu" }).click();
    await expect(addlinkDialog).toBeVisible();
  });

  test("a 4-character Link is blocked as too short", async ({ page }) => {
    const { addlinkDialog } = await openKudoFormAndAddlinkBox(page);
    await addlinkDialog.locator("#addlink-text").fill("Sample Link");
    await addlinkDialog.locator("#addlink-url").fill("www");
    await addlinkDialog.getByRole("button", { name: "Lưu" }).click();
    await expect(addlinkDialog.getByText("Nhập URL hợp lệ (http/https), từ 5 đến 2048 ký tự")).toBeVisible();
  });

  test("a valid save splices the link into the message and closes the box", async ({ page }) => {
    const { formDialog, addlinkDialog } = await openKudoFormAndAddlinkBox(page);
    await addlinkDialog.locator("#addlink-text").fill("Sample Link");
    await addlinkDialog.locator("#addlink-url").fill("https://www.example.com");
    await addlinkDialog.getByRole("button", { name: "Lưu" }).click();

    await expect(addlinkDialog).toBeHidden();
    await expect(formDialog.getByPlaceholder(/Hãy gửi gắm/)).toHaveValue("[Sample Link](https://www.example.com)");
  });

  test("Hủy discards the draft without touching the message", async ({ page }) => {
    const { formDialog, addlinkDialog } = await openKudoFormAndAddlinkBox(page);
    await addlinkDialog.locator("#addlink-text").fill("Discarded text");
    await addlinkDialog.locator("#addlink-url").fill("https://discarded.example.com");
    await addlinkDialog.getByRole("button", { name: "Hủy" }).click();

    await expect(addlinkDialog).toBeHidden();
    await expect(formDialog.getByPlaceholder(/Hãy gửi gắm/)).toHaveValue("");
  });

  test("Escape discards the draft the same way as Hủy", async ({ page }) => {
    const { formDialog, addlinkDialog } = await openKudoFormAndAddlinkBox(page);
    await addlinkDialog.locator("#addlink-text").fill("Discarded text");
    await page.keyboard.press("Escape");

    await expect(addlinkDialog).toBeHidden();
    await expect(formDialog.getByPlaceholder(/Hãy gửi gắm/)).toHaveValue("");
  });
});
