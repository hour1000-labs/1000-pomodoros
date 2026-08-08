// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { type LoadingSkeletonVariant, LoadingState } from './loading-state';

afterEach(cleanup);

describe('LoadingState', () => {
  it('renders default skeleton with default label and aria attributes', () => {
    render(<LoadingState />);
    const section = screen.getByLabelText('Loading saved progress');
    expect(section).toBeTruthy();
    expect(section.getAttribute('aria-busy')).toBe('true');
    expect(section.getAttribute('data-variant')).toBe('default');
  });

  it('renders custom accessibility label', () => {
    render(<LoadingState label="Loading custom content" />);
    expect(screen.getByLabelText('Loading custom content')).toBeTruthy();
  });

  it('renders the dedicated Journeys collection skeleton', () => {
    const { container } = render(<LoadingState variant="journeys" />);

    expect(container.querySelector('header')).toBeTruthy();
    expect(container.querySelectorAll('section section')).toHaveLength(2);
  });

  const variants: LoadingSkeletonVariant[] = [
    'home',
    'journeys',
    'journey',
    'milestone',
    'focus',
    'complete',
    'form',
    'settings',
    'landing',
    'default',
  ];

  variants.forEach((variant) => {
    it(`renders variant="${variant}" with correct data-variant attribute`, () => {
      const { container } = render(<LoadingState label={`Loading ${variant}`} variant={variant} />);
      const section = screen.getByLabelText(`Loading ${variant}`);
      expect(section).toBeTruthy();
      expect(section.getAttribute('data-variant')).toBe(variant);
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });
});
