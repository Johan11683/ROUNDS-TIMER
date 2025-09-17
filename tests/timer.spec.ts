// Tests PLAYWRIGHT

import { test, expect, Page } from "@playwright/test";

async function getTimerText(page: Page): Promise<string> {
  const raw = await page.locator(".circular__center").allInnerTexts();
  return raw.join("").replace(/\s+/g, "").trim();
}


test("le timer démarre et se met en pause", async ({ page }) => {
  // lance l’app locale
  await page.goto("http://localhost:5173");

  // clique sur ▶ (play) → bouton avec la classe .btn-play
  await page.click("button.btn-play");

  // on s’attend à voir le bouton pause (classe .btn-pause)
  await expect(page.locator("button.btn-pause")).toBeVisible();

  // clique sur ⏸ (pause)
  await page.click("button.btn-pause");

  // retour du bouton play
  await expect(page.locator("button.btn-play")).toBeVisible();
});


test("reset remet bien le compteur à la valeur initiale", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const initial = await getTimerText(page);

  await page.click("button.btn-play");
  await page.waitForTimeout(2000);

  await page.click("button.danger");

  const afterReset = await getTimerText(page);

  // ✅ compare en mode "contient"
  expect(afterReset).toContain(initial);
  // ou bien regex si tu veux être strict sur le format
  // expect(afterReset).toMatch(/^0{0,2}3:00$/);
});