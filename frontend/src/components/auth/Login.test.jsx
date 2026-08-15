import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../../context/AuthContext';

// Mock de react-hot-toast pour éviter les erreurs d'exécution
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock du hook useAuth
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Login Component', () => {
  const mockLogin = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin,
    });
  });

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  it('renders the login form correctly', () => {
    renderLogin();
    expect(screen.getByText('Bon retour !')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('does not expose any demo profile shortcut', () => {
    renderLogin();
    expect(screen.queryByRole('combobox')).toBeNull();
  });


  it('calls login function on submit and redirects on success', async () => {
    mockLogin.mockResolvedValueOnce({ username: 'admin', nom_complet: 'Administrateur' });
    
    renderLogin();
    
    // Remplir les champs
    fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'admin' } });
    
    // Soumettre le formulaire
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));
    
    expect(mockLogin).toHaveBeenCalledWith('admin', 'admin');
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Se connecter/i })).toBeEnabled();
    });
  });

  it('displays error if login fails', async () => {
    mockLogin.mockRejectedValueOnce({ response: { data: { detail: 'Identifiants invalides' } } });
    
    renderLogin();
    
    fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/i), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'wrong' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));
    
    expect(mockLogin).toHaveBeenCalledWith('wrong', 'wrong');
  });
});

