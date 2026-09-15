import { test, expect } from "@playwright/test";
import path from "node:path";

test("navigation unlocks after analysis and follows the visible section", async ({
  page,
}) => {
  await page.goto("/");
  const evidence = page.getByRole("link", { name: "Evidence" });
  await expect(evidence).toHaveAttribute("aria-disabled", "true");
  await evidence.click({ force: true });
  await expect(page).not.toHaveURL(/#evidence$/);

  await page.getByRole("button", { name: "Load sample notice" }).click();
  await expect(
    page.getByRole("heading", { name: "What happened" }),
  ).toBeVisible();
  await expect(evidence).not.toHaveAttribute("aria-disabled", "true");

  await page.locator("#actions").scrollIntoViewIfNeeded();
  await expect(page.getByRole("link", { name: "Action plan" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("sample → evidence → reject claim → checklist → export", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load sample notice" }).click();
  await expect(
    page.getByRole("heading", { name: "What happened" }),
  ).toBeVisible();
  await expect(page.getByText("66.7%")).toBeVisible();
  await page.getByText("Try to break it", { exact: false }).click();
  await page.getByRole("button", { name: "Run Proof Gate" }).click();
  await expect(page.getByRole("status")).toContainText("UNVERIFIED");
  await page.locator(".timeline input").first().check();
  await expect(page.getByText("1 of 4 complete")).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download privacy-safe packet" })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "noticelens-evidence-packet-redacted.json",
  );
});
test("mobile layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Load sample notice" }).click();
  await expect(
    page.getByRole("heading", { name: "What happened" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("real PDF upload and recoverable corrupt upload", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("checkbox", { name: "My rental property is in Texas" })
    .check();
  await page
    .getByLabel("Upload notice file")
    .setInputFiles(path.resolve("../sample-data/vacate.pdf"));
  await expect(
    page.getByRole("heading", { name: "What happened" }),
  ).toBeVisible();
  await expect(page.locator(".result-toolbar")).toContainText("YOUR DOCUMENT");
  await page.getByLabel("Upload notice file").setInputFiles({
    name: "broken.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-broken"),
  });
  await expect(page.locator('.alert[role="alert"]')).toContainText(
    "Could not read this document",
  );
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await page.getByRole("button", { name: "Load sample notice" }).click();
  await expect(
    page.getByRole("heading", { name: "What happened" }),
  ).toBeVisible();
});

test("deposit contradiction and complete print evidence", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Sample notice", { exact: true })
    .selectOption("deposit");
  await page.getByRole("button", { name: "Load sample notice" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Security-deposit dispute",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByText("Try to break it", { exact: false }).click();
  await page
    .getByLabel(
      "Candidate claim (checked against this notice’s first retrieved source)",
    )
    .fill(
      "A landlord may retain a security deposit to cover normal wear and tear.",
    );
  await page.getByRole("button", { name: "Run Proof Gate" }).click();
  await expect(page.getByRole("status")).toContainText("CONTRADICTED");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-draft")).toBeVisible();
  await expect(page.locator(".claim blockquote").first()).toBeVisible();
});
