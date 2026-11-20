import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe-core accessibility checks against a rendered DOM container in jsdom.
 */
export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      // jsdom does not compute layout/color-contrast accurately; Playwright verifies color-contrast in a real browser
      'color-contrast': { enabled: false },
    },
  });

  const summary = results.violations
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)
    .join('\n');

  expect(results.violations, summary || 'Expected zero accessibility violations').toEqual([]);
}
