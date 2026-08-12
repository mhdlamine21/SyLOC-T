import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AppLogo from './AppLogo';

describe('AppLogo Component', () => {
  it('renders correctly', () => {
    render(<AppLogo />);
    const container = screen.getByTestId('app-logo-container');
    expect(container).toBeInTheDocument();
  });

  it('displays the text when showText is true', () => {
    render(<AppLogo showText={true} />);
    const title = screen.getByText('SyLOC-T');
    expect(title).toBeInTheDocument();
  });
});
