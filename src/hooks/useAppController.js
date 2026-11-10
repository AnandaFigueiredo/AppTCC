import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
export function useAppController() {
  const [view, setView] = useState('login'),
    [user, setUser] = useState(null),
    [selectedCow, setSelectedCow] = useState(null);
  const [authError, setError] = useState(''),
    [authNotice, setNotice] = useState(''),
    [authLoading, setLoading] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (!s) setView('login');
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleLogin = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      if (!supabase) throw Error('Configure as variáveis públicas do Supabase no .env.');
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw Error('Confira email, senha e conexão.');
      setView('home');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateAccount = async form => {
    setLoading(true);
    setError('');
    try {
      if (!supabase) throw Error('Configure o Supabase.');
      if (form.password !== form.confirmPassword) throw Error('As senhas não coincidem.');
      const {
        error
      } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName
          }
        }
      });
      if (error) throw Error('Não foi possível cadastrar. Confira os campos.');
      setNotice('Confirme seu email e solicite autorização ao responsável pela base acadêmica.');
      setView('login');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      setError('Não foi possível sair. Tente novamente.');
      return;
    }
    setUser(null);
    setView('login');
  };
  return {
    activeView: user && view === 'login' ? 'home' : view,
    setView,
    user,
    selectedCow,
    openCowDetails: id => {
      setSelectedCow(id);
      setView('cowDetails');
    },
    handleLogin,
    handleCreateAccount,
    handleLogout,
    authError,
    authNotice,
    authLoading
  };
}
