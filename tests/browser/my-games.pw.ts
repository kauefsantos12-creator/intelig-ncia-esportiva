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
  await page
    .getByRole("group", { name: "Relatos salvos" })
    .getByRole("button", { name: /Clube Casa × Clube Fora/ })
    .click();
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

test("the branded page keeps the draft and archive mounted when in-page sections close", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Futebol visto\s*por você\./);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("nav")).toHaveCount(0);
  await page.getByLabel("Seu relato", { exact: true }).fill("A página continua com meu texto.");
  await page.getByRole("link", { name: "Conta e privacidade", exact: true }).click();
  await expect(page.locator("#conta")).toHaveAttribute("open", "");
  expect(new URL(page.url()).pathname).toBe("/my-games.html");
  await page.locator("#conta > summary").click();
  await page.locator("#historico > summary").click();
  await page.getByLabel("Nota no arquivo").fill("Nota preservada no arquivo.");
  await page.locator("#historico > summary").click();
  await page.locator("#historico > summary").click();
  await expect(page.getByLabel("Nota no arquivo")).toHaveValue("Nota preservada no arquivo.");
  await expect(page.getByLabel("Seu relato", { exact: true })).toHaveValue(
    "A página continua com meu texto.",
  );
  await page.getByRole("link", { name: "Privacidade", exact: true }).click();
  await expect(page.locator("#privacidade")).toHaveAttribute("open", "");
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});
