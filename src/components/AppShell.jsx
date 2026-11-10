import { useEffect } from 'react';
import Home from '../screens/Home';
import Cows from '../screens/Cows';
import CowDetails from '../screens/CowDetails';
import Alerts from '../screens/Alerts';
import Urgent from '../screens/Urgent';
import Reports from '../screens/Reports';
import WeeklyData from '../screens/WeeklyData';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import { Icon, PageHeader } from './UI';

const navigation = [['home', 'Visão geral'], ['cows', 'Animais'], ['weekly', 'Histórico'], ['alerts', 'Acompanhamento'], ['reports', 'Relatórios']];
export default function AppShell({ activeView, setView, user, selectedCow, openCowDetails, handleLogin, handleCreateAccount, handleLogout, authError, authNotice, authLoading }) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [activeView, selectedCow]);
  if (!user) return <main className="auth-layout">{activeView === 'signup' ? <Signup onBackToLogin={() => setView('login')} onCreateAccount={handleCreateAccount} isLoading={authLoading} error={authError}/> : <Login onLogin={handleLogin} onCreateAccount={() => setView('signup')} isLoading={authLoading} error={authError} notice={authNotice}/>}</main>;
  const screen = { home: <Home navigate={setView} onViewDetails={openCowDetails}/>, cows: <Cows onViewDetails={openCowDetails}/>, cowDetails: <CowDetails cowId={selectedCow}/>, alerts: <Alerts onViewDetails={openCowDetails}/>, urgent: <Urgent onViewDetails={openCowDetails}/>, reports: <Reports onViewDetails={openCowDetails}/>, weekly: <WeeklyData onViewDetails={openCowDetails}/> };
  const selected = activeView === 'cowDetails' ? 'cows' : activeView === 'urgent' ? 'alerts' : activeView;
  return <div className="app-layout"><a className="skip-link" href="#main-content">Ir para o conteúdo</a><aside className="sidebar"><button className="brand" onClick={() => setView('home')} aria-label="SerTech, visão geral"><img src="/LogoBar.svg" alt=""/><span>SerTech<small>Produtividade leiteira</small></span></button><p className="sidebar-label">ACOMPANHAMENTO</p><nav className="side-navigation" aria-label="Navegação principal">{navigation.map(([key, label]) => <button key={key} onClick={() => setView(key)} aria-current={selected === key ? 'page' : undefined}><Icon name={key}/><span>{label}</span></button>)}</nav><div className="sidebar-footer"><span className="status-indicator"/>Projeto acadêmico<span>Ciência da Computação · TCC</span></div></aside>
    <div className="app-workspace"><header className="topbar"><div className="desktop-breadcrumb">SerTech <span>/</span> {navigation.find(([key]) => key === selected)?.[1] || 'Perfil'}</div><button className="mobile-brand" onClick={() => setView('home')}><img src="/LogoBar.svg" alt=""/>SerTech</button><button className="profile-button" onClick={() => setView('profile')} aria-label="Abrir perfil"><span className="profile-avatar"><Icon name="profile" size={18}/></span><span className="profile-text">Minha conta</span></button></header>
      <main className="page-content" id="main-content">{activeView === 'cowDetails' && <button className="back-link" onClick={() => setView('cows')}><Icon name="back" size={17}/>Voltar aos animais</button>}{activeView === 'profile' ? <><PageHeader eyebrow="Conta" title="Meu perfil" description="Informações de acesso à plataforma acadêmica."/><section className="panel profile-panel"><span className="profile-avatar large"><Icon name="profile" size={26}/></span><h2>{user.email}</h2><p className="muted">Acesso acadêmico · sem assinatura</p>{authError && <p role="alert" className="error-state">{authError}</p>}<button className="button button-secondary" onClick={handleLogout}>Sair da conta</button></section></> : screen[activeView] || screen.home}<footer className="page-footer">SerTech · Apoio à decisão na produtividade leiteira <span>Dados registrados · Interpretação contextual</span></footer></main>
    </div><nav className="bottom-navigation" aria-label="Navegação móvel">{navigation.map(([key, label]) => <button key={key} onClick={() => setView(key)} aria-current={selected === key ? 'page' : undefined}><Icon name={key} size={20}/><span>{key === 'home' ? 'Início' : key === 'alerts' ? 'Revisão' : label}</span></button>)}</nav></div>;
}
