import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrangeMoneyLogo, WaveLogo, FreeMoneyLogo } from './PaymentLogos';

describe('PaymentLogos Components', () => {
  it('affiche le logo Orange Money', () => {
    render(<OrangeMoneyLogo size={32} />);
    expect(screen.getByRole('img', { name: /Logo Orange Money/i })).toBeInTheDocument();
  });

  it('affiche le logo Wave', () => {
    render(<WaveLogo size={32} />);
    expect(screen.getByRole('img', { name: /Logo Wave/i })).toBeInTheDocument();
  });

  it('affiche le logo Free Money', () => {
    render(<FreeMoneyLogo size={32} />);
    expect(screen.getByRole('img', { name: /Logo Free Money/i })).toBeInTheDocument();
  });
});
