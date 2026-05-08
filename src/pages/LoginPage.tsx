import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      login(token, user);
      
      // O redirecionamento será automático pelo AuthGuard no App.tsx
    } catch (err: any) {
      console.error('Erro no login:', err);
      const message = err.response?.data?.error || 'Erro ao conectar ao servidor.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <h1 className="logo">Agência<span>.</span></h1>
          <p>Entre na sua conta para gerenciar seus projetos.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label><Mail size={16} /> E-mail</label>
            <input 
              type="email" 
              required 
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label><Lock size={16} /> Senha</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <LogIn size={20} />
                Acessar Sistema
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Esqueceu a senha? Entre em contato com o administrador.</p>
        </div>
      </div>
    </div>
  );
};
