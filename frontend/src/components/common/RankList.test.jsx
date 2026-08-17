import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RankList } from './dashboard';

describe('RankList', () => {
  it('affiche le message vide quand aucun élément n\'est fourni', () => {
    render(<RankList items={[]} empty="Aucun occupant noté." />);
    expect(screen.getByText('Aucun occupant noté.')).toBeInTheDocument();
  });

  it('affiche les rangs personnalisés et le badge Vous pour l\'occupant connecté', () => {
    const items = [
      { key: '1', rank: 1, title: 'Amadou Sow', subtitle: 'Niveau PLATINE', value: '95 pts' },
      { key: '2', rank: 2, title: 'Fatou Ndiaye', subtitle: 'Niveau OR', value: '85 pts' },
      { key: '10', rank: 15, highlight: true, title: 'Moussa Diop', subtitle: 'Niveau BRONZE', value: '30 pts' },
    ];

    render(<RankList items={items} />);

    expect(screen.getByText('Amadou Sow')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    expect(screen.getByText('Fatou Ndiaye')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Moussa Diop')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Vous')).toBeInTheDocument();
  });
});
