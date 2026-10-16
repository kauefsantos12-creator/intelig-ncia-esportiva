import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const fixture = "/tests/browser/fixtures/personal-reports.html";
test("personal report can be saved, reopened and edited on desktop and touch", async ({ page }) => {
  await page.goto(fixture);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByLabel("Mandante", { exact: true }).fill("Clube da Casa");
  await page.getByLabel("Visitante", { exact: true }).fill("Clube Visitante");
  await page.getByLabel("Data e hora de Brasília").fill("2026-10-16T20:00");
  await page
    .getByLabel("Seu relato", { exact: true })
    .fill("Primeira impressão\nPressão no meio-campo.");
  await page.getByRole("button", { name: "Salvar relato", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Relato salvo");
  await page.reload();
  await page.getByRole("button", { name: /Clube da Casa × Clube Visitante/ }).click();
  await expect(page.getByLabel("Seu relato", { exact: true })).toHaveValue(
    "Primeira impressão\nPressão no meio-campo.",
  );
  await expect(page.getByLabel("Data e hora de Brasília")).toHaveValue("2026-10-16T20:00");
  await page.getByLabel("Seu relato", { exact: true }).fill("Leitura revista após o intervalo.");
  await page.getByRole("button", { name: "Salvar relato", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Relato salvo");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("failed save and conflicting session preserve the unsaved text", async ({ page }) => {
  await page.goto(fixture);
  await page.getByLabel("Mandante", { exact: true }).fill("Casa");
  await page.getByLabel("Visitante", { exact: true }).fill("Fora");
  await page.getByLabel("Seu relato", { exact: true }).fill("Este texto precisa continuar aqui.");
  await page.evaluate(() => {
    window.reportFailure = "NETWORK";
  });
  await page.getByRole("button", { name: "Salvar relato", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível confirmar");
  await expect(page.getByLabel("Seu relato", { exact: true })).toHaveValue(
    "Este texto precisa continuar aqui.",
  );
  await expect(page.getByText("Relato salvo.", { exact: false })).toHaveCount(0);
  await page.evaluate(() => {
    window.reportFailure = "CONFLICT";
  });
  await page.getByRole("button", { name: "Salvar relato", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("outra sessão");
  await expect(page.getByLabel("Seu relato", { exact: true })).toHaveValue(
    "Este texto precisa continuar aqui.",
  );
  await page.evaluate(() => {
    window.reportFailure = undefined;
  });
  await page.getByRole("button", { name: "Salvar relato", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Relato salvo");
});
