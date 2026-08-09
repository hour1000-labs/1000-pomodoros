// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandMark } from './brand-mark';

describe('BrandMark', () => {
  it('places a decorative, dimensioned logo before the accessible wordmark', () => {
    const { container } = render(<BrandMark />);
    const image = container.querySelector('img');
    const text = container.querySelector('span span');

    expect(image?.getAttribute('src')).toContain('brand-mark.png');
    expect(image?.getAttribute('alt')).toBe('');
    expect(image?.getAttribute('aria-hidden')).toBe('true');
    expect(image?.getAttribute('width')).toBe('32');
    expect(image?.getAttribute('height')).toBe('32');
    expect(text?.textContent).toBe('1000 Pomodoros');
  });
});
