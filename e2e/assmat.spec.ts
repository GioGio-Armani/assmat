import { expect, test } from "@playwright/test";

test("création contrat, pointages, récap mensuel et PDF", async ({ page }) => {
  const month = new Date().toISOString().slice(0, 7);
  const childName = `Test-${Date.now()}`;

  await page.goto("/");

  const childField = page.getByLabel("Enfant");
  if (!(await childField.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Nouveau contrat" }).click();
  }
  await childField.fill(childName);
  await page.getByLabel("Début").fill(`${month}-01`);
  await page.getByLabel("Heures/jour").fill("8");
  await page.getByLabel("Jours/semaine").selectOption("4");
  await page.getByLabel("Semaines/an").fill("46");
  await page.getByLabel("Taux base (0 = auto via grille)").fill("4");
  await page.getByRole("button", { name: "Créer le contrat" }).click();

  await expect(page.getByRole("link", { name: childName })).toBeVisible();
  await page.getByRole("link", { name: childName }).click();

  await page.getByLabel("Mois").fill(month);
  await page.getByLabel("Date").fill(`${month}-03`);
  await page.getByLabel("Arrivée").fill("08:00");
  await page.getByLabel("Départ").fill("18:00");
  await page.getByLabel("Repas").fill("1");
  await page.getByRole("button", { name: "Enregistrer pointage" }).click();
  await expect(page.getByText("Pointage enregistré")).toBeVisible();

  await page.getByLabel("Date").fill(`${month}-04`);
  await page.getByLabel("Arrivée").fill("08:00");
  await page.getByLabel("Départ").fill("18:00");
  await page.getByRole("button", { name: "Enregistrer pointage" }).click();
  await expect(page.getByText("Pointage enregistré")).toBeVisible();

  await page.getByRole("button", { name: "Mois" }).click();
  await expect(page.getByText("20.00 h")).toBeVisible();
  await expect(page.getByText("4.00 h")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Télécharger PDF" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
});
