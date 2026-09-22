import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
test('sample, full review download, energy and schedule', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Same energy. Better timing.' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    '550 combinations checked',
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download review JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const data = JSON.parse(await readFile(path!, 'utf8'));
  expect(data.result.best.energy).toBeCloseTo(22);
  expect(data.result.best.cost).toBeLessThan(data.result.baseline.cost);
  expect(data.scenario.rates).toHaveLength(24);
  await page.getByText('Inspect all 24 hours and rates').click();
  await expect(page.locator('tbody tr')).toHaveCount(24);
});
test('edits invalidate results and recompute infeasibility', async ({
  page,
}) => {
  await page.getByLabel('Power cap (kW)', { exact: true }).fill('0.1');
  await expect(
    page.getByRole('button', { name: 'Download review JSON' }),
  ).toBeDisabled();
  await expect(page.locator('#output')).toBeEmpty();
  await page.getByRole('button', { name: 'Find lowest-cost schedule' }).click();
  await expect(
    page.getByRole('heading', { name: 'No schedule fits this power cap.' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('0 feasible');
});
test('bad input is focused and never silently treated as zero', async ({
  page,
}) => {
  await page.getByLabel('Base load (kW)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Find lowest-cost schedule' }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Base load');
  await page.getByRole('button', { name: 'Reset sample' }).click();
  await page.getByLabel('Hourly rates').fill('1,2');
  await page.getByRole('button', { name: 'Find lowest-cost schedule' }).click();
  await expect(page.getByRole('alert')).toContainText('24 decimal rates');
});
test('load removal, addition and HTML-safe names', async ({ page }) => {
  await page.getByRole('button', { name: 'Remove load 3' }).click();
  await page.getByRole('button', { name: '+ Add load' }).click();
  await page
    .getByRole('textbox', { name: 'Load 3 Name', exact: true })
    .fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Find lowest-cost schedule' }).click();
  await expect(page.locator('.schedule-list img')).toHaveCount(0);
  await expect(page.locator('.schedule-list')).toContainText(
    '<img src=x onerror=alert(1)>',
  );
  await expect(page.getByRole('button', { name: '+ Add load' })).toBeDisabled();
});
test('baseline outside operating window is rejected', async ({ page }) => {
  await page.getByLabel('Load 1 Baseline start').fill('23');
  await page.getByRole('button', { name: 'Find lowest-cost schedule' }).click();
  await expect(page.getByRole('alert')).toContainText('baseline start');
});
test('keyboard skip link and reset are usable', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to workspace' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#workspace/);
  await page.getByRole('button', { name: 'Reset sample' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('combinations checked');
});
for (const width of [320, 390, 768, 1440]) {
  test(`accessible responsive interface at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
test('doubled text size fits viewport and no runtime errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addStyleTag({ content: 'html{font-size:200%}' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Reset sample' }).click();
  expect(errors).toEqual([]);
});
