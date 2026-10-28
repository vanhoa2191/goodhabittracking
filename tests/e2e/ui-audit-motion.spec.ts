import { expect, test } from "@playwright/test";
import { pairedChild } from "./ui-audit-child-fixture";

for (const motion of ["no-preference", "reduce"] as const) {
  test(`A09 ${motion}: visible loading, praise and final task status survive motion preferences`, async ({ page }) => {
    const f = await pairedChild(page, { approval: true });
    await page.emulateMedia({ reducedMotion: motion });
    await f.card.locator("[data-task-toggle]").click();
    const command = await f.received(1);
    await expect(f.card.getByText("Đang lưu…", { exact: true })).toBeVisible();
    await expect(f.card.locator("[data-task-toggle]")).toBeDisabled();
    const indicator = f.card.locator('[data-task-toggle] svg.animate-pulse');
    if (motion === "reduce") {
      await expect.poll(() => indicator.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
    } else {
      await expect.poll(() => indicator.evaluate(element => getComputedStyle(element).animationName)).toBe("pulse");
    }
    await page.clock.runFor(2000);
    await expect(f.card.getByText("Đang lưu…", { exact: true })).toBeVisible();
    await f.complete(command, true);
    await expect(f.card.getByTestId("task-praise")).toBeVisible();
    await expect(f.card.locator("[data-task-state]")).toHaveText("Chờ ba mẹ duyệt");
    await expect(f.balance(40)).toBeVisible();
    await page.clock.runFor(5000);
    await expect(f.card.locator("[data-task-state]")).toHaveText("Chờ ba mẹ duyệt");
    await expect(f.card.locator("[data-task-toggle]")).toBeDisabled();
    expect(f.commands).toHaveLength(1);
  });

  test(`A09 ${motion}: timer pause/reset and completed controls preserve save recovery at all scales`, async ({ page }) => {
    test.setTimeout(90_000);
    const f = await pairedChild(page, { timer: true });
    await page.emulateMedia({ reducedMotion: motion });
    await page.setViewportSize({ width: 375, height: 812 });
    for (const scale of [1, 1.08, 1.18]) {
      // Geometry setup only; persistence is separately covered by A08 UI tests.
      await page.evaluate(value => document.documentElement.style.setProperty("--app-font-scale", String(value)), scale);
      const trigger = f.card.getByRole("button", { name: "1m Bắt đầu", exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Đồng hồ thói quen", exact: true });
      await dialog.getByRole("button", { name: "Bắt đầu", exact: true }).click();
      await page.clock.runFor(1000);
      await expect(dialog.getByRole("status")).toBeEmpty();
      await dialog.getByRole("button", { name: "Tạm dừng", exact: true }).click();
      await page.clock.runFor(2000);
      await expect(dialog.getByText("00:59", { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Đặt lại", exact: true }).click();
      await expect(dialog.getByText("01:00", { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Bắt đầu", exact: true }).click();
      for (let second = 0; second < 60; second++) await page.clock.runFor(1000);
      await expect(dialog.getByText("Hoàn thành thời gian", { exact: true })).toBeVisible();
      const feedback = dialog.getByRole("status").locator("div");
      await expect.poll(() => feedback.evaluate(element => getComputedStyle(element).animationName))
        .toBe(motion === "reduce" ? "none" : "bounce");
      const done = dialog.getByRole("button", { name: "Đã xong & Đóng", exact: true });
      await expect(done).toBeFocused();
      const statuses = dialog.getByRole("status");
      await expect(statuses).toHaveCount(1);
      await expect(statuses).toHaveText("Hoàn thành thời gian");
      const sizes = await dialog.getByRole("button").evaluateAll(buttons => buttons.map(button => {
        const { width, height } = button.getBoundingClientRect();
        return { width, height };
      }));
      expect(sizes).toHaveLength(2);
      for (const size of sizes) {
        expect(size.width, `${scale} completed width`).toBeGreaterThanOrEqual(44);
        expect(size.height, `${scale} completed height`).toBeGreaterThanOrEqual(44);
      }
      expect(f.commands).toHaveLength(0);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      // Clearing the selected activity resets the timer on the next open.
    }
    await f.card.getByRole("button", { name: "1m Bắt đầu", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Đồng hồ thói quen", exact: true });
    await dialog.getByRole("button", { name: "Bắt đầu", exact: true }).click();
    for (let second = 0; second < 60; second++) await page.clock.runFor(1000);
    const done = dialog.getByRole("button", { name: "Đã xong & Đóng", exact: true });
    await done.evaluate(button => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const first = await f.received(1);
    await expect(dialog.getByRole("button", { name: "Đang lưu…", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.clock.runFor(1000);
    await expect(dialog).toBeVisible();
    expect(f.commands).toHaveLength(1);
    await f.refuse(first);
    await expect(dialog.getByRole("alert")).toContainText(/Chưa xác nhận được/);
    const retry = dialog.getByRole("button", { name: /thử.*lại/i });
    await expect(retry).toBeFocused();
    await expect(dialog.getByText("Hoàn thành thời gian", { exact: true })).toBeVisible();
    await retry.press("Enter");
    await f.complete(await f.received(2));
    await expect(dialog).toHaveCount(0);
    expect(f.commands).toHaveLength(2);
  });
}
