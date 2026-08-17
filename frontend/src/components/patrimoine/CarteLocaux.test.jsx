import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CarteLocaux from './CarteLocaux';

vi.mock('../common/InteractiveGpsMap', () => ({
  default: () => <div data-testid="interactive-gps-map">Carte Interactive</div>,
}));

describe('CarteLocaux', () => {
  it('affiche le header redessiné et la carte', () => {
    render(<CarteLocaux />);

    expect(screen.getByText('Carte GPS des locaux')).toBeInTheDocument();
    expect(screen.getByText(/Localisez les cantines, boutiques et espaces artisanaux/i)).toBeInTheDocument();
    expect(screen.getByTestId('interactive-gps-map')).toBeInTheDocument();
    expect(screen.getByText('Local disponible')).toBeInTheDocument();
    expect(screen.getByText('Local occupé')).toBeInTheDocument();
    expect(screen.getByText('Votre position')).toBeInTheDocument();
  });

  it('propose le bouton de bascule plein écran', () => {
    render(<CarteLocaux />);
    const bouton = screen.getByRole('button', { name: /Plein écran/i });
    expect(bouton).toBeInTheDocument();
    fireEvent.click(bouton);
  });
});
