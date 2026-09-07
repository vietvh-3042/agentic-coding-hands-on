import { test, expect, Page } from "@playwright/test";

/**
 * Rules Drawer E2E Red Gate (9 MoMorph cases + body scroll lock)
 *
 * OPEN/CLOSED ASSERTION STRATEGY:
 * The drawer is always mounted in the DOM with aria-hidden={!open} and
 * pointer-events-none when closed, translate-x-full for the panel.
 * We assert on aria-hidden="false" (not toBeVisible()) and wait for the
 * transform transition (duration-300) via the attribute, never via timeout.
 */

async function openDrawer(page: Page): Promise<void> {
  // Navigate to /about (authenticated via storageState)
  await page.goto("/about");

  // Click FAB trigger — one persistent button, aria-haspopup="menu"
  const trigger = page.getByRole("button", { name: /\/|saa/i }); // closed state has / icon + logo
  await trigger.click();

  // Click "Thể lệ" menuitem inside widget-fab-menu
  const rulesMenuItem = page.getByRole("menuitem", { name: "Thể lệ" });
  await rulesMenuItem.click();

  // Wait for drawer to open — wrapper's aria-hidden goes to false
  const wrapper = page.locator("div[aria-hidden]").filter({ has: page.locator('aside[role="dialog"]') });
  await expect(wrapper).toHaveAttribute("aria-hidden", "false");
}

test.describe("Rules Drawer", () => {
  test("TC_THELE_GUI_001: drawer renders title, description, 6 badges, both footer buttons", async ({ page }) => {
    await openDrawer(page);

    // Title
    await expect(page.getByRole("heading", { name: "Thể lệ" })).toBeVisible();

    // Description in receiver section
    await expect(page.getByText(/Dựa trên số lượng đồng đội gửi trao Kudos/)).toBeVisible();

    // 6 collectible badges in sender section (scope to dialog to avoid page conflicts)
    const dialog = page.getByRole("dialog", { name: "Thể lệ" });
    const collectibles = [
      "REVIVAL",
      "TOUCH OF LIGHT",
      "STAY GOLD",
      "FLOW TO HORIZON",
      "BEYOND THE BOUNDARY",
      "ROOT FURTHER",
    ];
    await Promise.all(collectibles.map((label) => expect(dialog.getByAltText(label)).toBeVisible()));

    // Both footer buttons
    const closeBtn = page.getByRole("button", { name: "Đóng" });
    const writeBtn = page.getByRole("button", { name: "Viết KUDOS" });
    await expect(closeBtn).toBeVisible();
    await expect(writeBtn).toBeVisible();
  });

  test("TC_THELE_GUI_002: close button is outlined/secondary, write is gold/primary", async ({ page }) => {
    await openDrawer(page);

    const closeBtn = page.getByRole("button", { name: "Đóng" });
    const writeBtn = page.getByRole("button", { name: "Viết KUDOS" });

    // Close button: outlined/secondary (border-white/40, text-white, hover:bg-white/10)
    const closeBg = await closeBtn.evaluate((el: HTMLElement) => window.getComputedStyle(el).backgroundColor);
    expect(closeBg).toMatch(/rgba?\(0,\s*0,\s*0,\s*0\)|transparent/);

    // Write button: gold/primary (bg-[#FFEA9E])
    const writeBg = await writeBtn.evaluate((el: HTMLElement) => window.getComputedStyle(el).backgroundColor);
    expect(writeBg).toMatch(/255,\s*234,\s*158/);
  });

  test("TC_THELE_GUI_004: hover restyles each footer button", async ({ page }) => {
    await openDrawer(page);

    const closeBtn = page.getByRole("button", { name: "Đóng" });
    const writeBtn = page.getByRole("button", { name: "Viết KUDOS" });

    // Close button: check background color changes on hover (hover:bg-white/10)
    const closeColorBefore = await closeBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    await closeBtn.hover();
    const closeColorAfter = await closeBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(closeColorAfter).not.toBe(closeColorBefore);

    // Write button: check shadow changes on hover (hover:shadow-[...])
    const writeShadowBefore = await writeBtn.evaluate((el) => window.getComputedStyle(el).boxShadow);
    await writeBtn.hover();
    const writeShadowAfter = await writeBtn.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(writeShadowAfter).not.toBe(writeShadowBefore);
  });

  test("TC_THELE_FUN_001: panel body scrolls with real content", async ({ page }) => {
    await openDrawer(page);

    const scrollContainer = page.locator("aside[role=dialog] > div").first();
    const scrollHeight = await scrollContainer.evaluate((el: HTMLElement) => el.scrollHeight);
    const clientHeight = await scrollContainer.evaluate((el: HTMLElement) => el.clientHeight);

    // Real content is longer than viewport
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    // Scroll is possible
    const initialScroll = await scrollContainer.evaluate((el: HTMLElement) => el.scrollTop);
    await scrollContainer.evaluate((el: HTMLElement) => {
      // eslint-disable-next-line no-param-reassign
      el.scrollTop = 100;
    });
    const afterScroll = await scrollContainer.evaluate((el: HTMLElement) => el.scrollTop);
    expect(afterScroll).toBeGreaterThan(initialScroll);
  });

  test("TC_THELE_FUN_003: close button closes drawer and page beneath is usable", async ({ page }) => {
    await openDrawer(page);

    const wrapper = page.locator("div[aria-hidden]").filter({ has: page.locator('aside[role="dialog"]') });
    const closeBtn = page.getByRole("button", { name: "Đóng" });

    await closeBtn.click();

    // Wait for transition (300ms) and check drawer closed
    await expect(wrapper).toHaveAttribute("aria-hidden", "true");

    // Page beneath is usable — drawer overlay removed
    await expect(wrapper).toHaveClass(/pointer-events-none/);
  });

  test("TC_THELE_FUN_004: write KUDOS closes drawer and opens kudos form modal", async ({ page }) => {
    await openDrawer(page);

    const wrapper = page.locator("div[aria-hidden]").filter({ has: page.locator('aside[role="dialog"]') });
    const writeBtn = page.getByRole("button", { name: "Viết KUDOS" });

    await writeBtn.click();

    // Drawer closes
    await expect(wrapper).toHaveAttribute("aria-hidden", "true");

    // Kudos form modal opens
    const kudosModal = page.locator("[role=dialog]").filter({ has: page.getByText(/Gửi kudo|Write kudo/i) });
    await expect(kudosModal).toBeVisible({ timeout: 1000 });
  });

  /*
   * TC_THELE_GUI_003 (disabled button dimmed) and TC_THELE_FUN_005 (disabled
   * button rejects clicks) are deliberately NOT implemented — recorded as N/A.
   *
   * Spec row B asks for a disabled footer state, but the condition is
   * unreachable for this button: `onWriteKudos` closes the drawer before the
   * kudos form opens (widget-button.tsx `handleWriteKudos`), and while closed
   * the wrapper is `aria-hidden` + `pointer-events-none` — so the footer button
   * is never on screen during a submit, and "disabled" has no meaning there.
   * Asserting it unconditionally would also contradict TC_THELE_FUN_004 above,
   * which clicks that same button and expects the modal to open.
   *
   * The dimmed-and-unclickable behaviour the spec describes already exists at
   * the point a submit actually happens: kudos-form-modal.tsx's submit button
   * carries `disabled={!isValid || status === "submitting"}` with
   * `disabled:opacity-40`.
   *
   * Decision + rationale: plans/260907-1402-three-screen-gap-closure/clarifications.md
   */

  test("Body scroll lock: scroll locked while drawer open, restored on close", async ({ page }) => {
    // Ensure page has scrollable content
    await page.goto("/about");

    await openDrawer(page);

    // While drawer open, body.style.overflow = "hidden"
    const lockedOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(lockedOverflow).toBe("hidden");

    // Close drawer
    const closeBtn = page.getByRole("button", { name: "Đóng" });
    await closeBtn.click();

    // Wait for transition
    const wrapper = page.locator("div[aria-hidden]").filter({ has: page.locator('aside[role="dialog"]') });
    await expect(wrapper).toHaveAttribute("aria-hidden", "true");

    // Overflow restored (check that it's no longer hidden)
    const restoredOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflow).not.toBe("hidden");
  });
});
