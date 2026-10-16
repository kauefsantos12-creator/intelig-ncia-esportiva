import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const url = "http://127.0.0.1:4176/my-games.html";

test("Meus Jogos shows starters and bench, prefills a report and reopens the saved text", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Escalação da partida" })).toBeVisible();
  await expect(page.getByText("Titular Casa", { exact: true })).toBeVisible();
  await expect(page.getByText("Reserva Casa", { exact: true })).not.toBeVisible();
  await page.getByLabel("Escalação do Clube Casa").locator("summary").click();
  await expect(page.getByText("Reserva Casa", { exact: true })).toBeVisible();
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(a11y.violations).toEqual([]);
  await page.getByLabel("Preencher com uma partida carregada").selectOption("fixture-test");
  await page.getByRole("button", { name: "Usar partida selecionada" }).click();
  await expect(page.getByLabel("Mandante", { exact: true })).toHaveValue("Clube Casa");
  await expect(page.getByLabel("Data e hora de Brasília")).toHaveValue("2026-10-16T20:00");
  await page.getByLabel("Seu relato", { exact: true }).fill("Minha leitura do primeiro tempo.");
  await page.getByRole("button", { name: "Salvar relato", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Relato salvo");
  await page.reload();
  await page.getByRole("button", { name: /Clube Casa × Clube Fora/ }).click();
  await expect(page.getByLabel("Seu relato", { exact: true })).toHaveValue(
    "Minha leitura do primeiro tempo.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("a lineup failure and a cancelled fixture switch keep the current draft", async ({ page }) => {
  await page.goto(url);
  await page.getByLabel("Seu relato", { exact: true }).fill("Meu rascunho continua aqui.");
  await page.getByRole("button", { name: "Simular escalação indisponível" }).click();
  await expect(page.getByRole("alert")).toContainText("continuar escrevendo");
  await expect(page.getByLabel("Seu relato", { exact: true })).toHaveValue(
    "Meu rascunho continua aqui.",
  );
  await page.getByLabel("Preencher com uma partida carregada").selectOption("fixture-test");
  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("button", { name: "Usar partida selecionada" }).click();
  await expect(page.getByLabel("Seu relato", { exact: true })).toHaveValue(
    "Meu rascunho continua aqui.",
  );
});
