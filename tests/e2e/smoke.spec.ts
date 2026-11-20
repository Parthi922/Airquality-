import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('search city -> view AQI -> ask assistant -> accessibility scan', async ({ page }) => {
  await page.route('**/api/geocode?q=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: '1850147',
            name: 'Tokyo',
            country: 'Japan',
            countryCode: 'JP',
            latitude: 35.6895,
            longitude: 139.6917,
            timezone: 'Asia/Tokyo',
          },
        ],
      }),
    });
  });

  await page.route('**/api/aqi?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        location: {
          id: '1850147',
          name: 'Tokyo',
          country: 'Japan',
          countryCode: 'JP',
          latitude: 35.6895,
          longitude: 139.6917,
        },
        fetchedAt: '2026-11-20T08:00:00Z',
        source: 'Open-Meteo Air Quality',
        current: {
          usAqi: 44,
          europeanAqi: 24,
          category: {
            id: 'good',
            label: 'Good',
            shortLabel: 'Good',
            rangeLabel: '0–50',
            description: 'Air quality is satisfactory with minimal health risk.',
            symbol: '●',
            surfaceClass: 'bg-emerald-50 dark:bg-emerald-950/60',
            textClass: 'text-emerald-900 dark:text-emerald-200',
            borderClass: 'border-emerald-300 dark:border-emerald-700',
            accentHex: '#047857',
          },
          dominantPollutant: 'pm2_5',
          uvIndex: 3.1,
          pollutants: [
            {
              id: 'pm2_5',
              name: 'Fine Particulate Matter',
              formula: 'PM2.5',
              value: 8.2,
              unit: 'µg/m³',
              subIndex: 46,
              statusLabel: 'Good',
              ratioToWhoLimit: 0.55,
              standard: {
                standardName: 'WHO 2021 Guideline (24h)',
                standardUrl: 'https://www.who.int/',
                thresholdValue: 15,
                thresholdUnit: 'µg/m³',
                averagingPeriod: '24-hour mean',
              },
            },
          ],
        },
        hourly: [
          {
            time: '2026-11-20T06:00',
            usAqi: 38,
            europeanAqi: 20,
            pm2_5: 7.1,
            pm10: 14,
            no2: 12,
            o3: 45,
            so2: 2,
            co: 200,
          },
          {
            time: '2026-11-20T07:00',
            usAqi: 41,
            europeanAqi: 22,
            pm2_5: 7.6,
            pm10: 15,
            no2: 14,
            o3: 46,
            so2: 2,
            co: 210,
          },
          {
            time: '2026-11-20T08:00',
            usAqi: 44,
            europeanAqi: 24,
            pm2_5: 8.2,
            pm10: 16,
            no2: 15,
            o3: 48,
            so2: 2,
            co: 215,
          },
        ],
        summary: { min24hAqi: 38, max24hAqi: 44, avg24hAqi: 41 },
      }),
    });
  });

  await page.route('**/api/chat', async (route) => {
    const sse =
      'event: delta\ndata: {"text":"Tokyo US AQI is 44 (Good) with PM2.5 at 8.2 µg/m³."}\n\n' +
      'event: done\ndata: {"completed":true}\n\n';
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: sse,
    });
  });

  await page.goto('/');

  const searchInput = page.getByRole('combobox', {
    name: /Search city or use your current location/i,
  });
  await searchInput.fill('Tokyo');
  await page.getByRole('option', { name: /Tokyo/i }).click();

  await expect(page.getByRole('heading', { name: 'Tokyo' })).toBeVisible();
  await expect(page.getByText('44')).toBeVisible();

  const chatInput = page.getByPlaceholder(/Ask about Tokyo/i);
  await chatInput.fill('Is it safe to run at 6am?');
  await page.getByRole('button', { name: /Ask Assistant/i }).click();

  await expect(page.getByText(/Tokyo US AQI is 44 \(Good\)/)).toBeVisible();

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);
});
