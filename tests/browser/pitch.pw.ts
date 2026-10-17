import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const url = "http://127.0.0.1:4176/pitch.html";
const player = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^${name}, camisa`) });

test("tactical formations let the user rate players, reopen and remove a saved score", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator(".pitch-line")).toHaveCount(4);
  expect(
    await page
      .locator(".pitch-line")
      .evaluateAll((lines) => lines.map((line) => line.children.length)),
  ).toEqual([2, 4, 4, 1]);
  await player(page, "Jogador Casa 1").click();
  await page.getByLabel("Nota de Jogador Casa 1", { exact: true }).selectOption("7.5");
  await expect(page.getByRole("button", { name: "Salvar nota", exact: true })).toBeDisabled();
  await page.getByLabel("Eu vi este jogador atuar nesta partida.").check();
  await page.getByRole("button", { name: "Salvar nota", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Nota 7,5");
  await page.reload();
  await expect(player(page, "Jogador Casa 1")).toContainText("7,5");
  await page.getByRole("button", { name: "Clube Fora", exact: true }).click();
  expect(
    await page
      .locator(".pitch-line")
      .evaluateAll((lines) => lines.map((line) => line.children.length)),
  ).toEqual([2, 5, 3, 1]);
  await page.getByRole("button", { name: "Clube Casa", exact: true }).click();
  await player(page, "Jogador Casa 1").click();
  await page.getByLabel("Nota de Jogador Casa 1", { exact: true }).selectOption("");
  await page.getByRole("button", { name: "Remover nota", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("removida");
  await page.reload();
  await expect(player(page, "Jogador Casa 1")).toContainText("—");
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("failures, conflicts and switching players preserve the unsaved personal score", async ({
  page,
}) => {
  await page.goto(url);
  await player(page, "Jogador Casa 1").click();
  await page.getByLabel("Nota de Jogador Casa 1", { exact: true }).selectOption("8");
  await page.getByLabel("Eu vi este jogador atuar nesta partida.").check();
  await player(page, "Jogador Casa 2").click();
  await player(page, "Jogador Casa 1").click();
  await expect(page.getByLabel("Nota de Jogador Casa 1", { exact: true })).toHaveValue("8");
  await page.getByLabel("Transporte de teste").selectOption("failure");
  await page.getByRole("button", { name: "Salvar nota", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Sua nota continua selecionada");
  await page.getByLabel("Transporte de teste").selectOption("conflict");
  await page.getByRole("button", { name: "Salvar nota", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("mudou em outra sessão");
  await expect(page.getByLabel("Nota de Jogador Casa 1", { exact: true })).toHaveValue("8");
  await page.getByLabel("Transporte de teste").selectOption("success");
  await page.getByRole("button", { name: "Salvar nota", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("salva");
  await page.getByLabel("Nota de Jogador Casa 1", { exact: true }).selectOption("9");
  await page.getByRole("button", { name: "Simular falha ao carregar notas" }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível carregar");
  await expect(page.getByRole("button", { name: "Salvar nota", exact: true })).toBeDisabled();
});

test("a listed substitute needs manual observation and zero is a valid saved score", async ({
  page,
}) => {
  await page.goto(url);
  await page.locator(".pitch-bench > summary").click();
  await player(page, "Reserva Casa 12").click();
  await page.getByLabel("Nota de Reserva Casa 12", { exact: true }).selectOption("0");
  await expect(page.getByRole("button", { name: "Salvar nota", exact: true })).toBeDisabled();
  await page.getByLabel("Eu vi este jogador atuar nesta partida.").check();
  await page.getByRole("button", { name: "Salvar nota", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Nota 0,0");
  await expect(player(page, "Reserva Casa 12")).toContainText("0,0");
});
