import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Cloud,
  KeyRound,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

type AuthMode = 'login' | 'register' | 'reset';

function translateFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
    case 'auth/invalid-email':
      return 'O endereço de e-mail informado é inválido.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Use a aba "Entrar" ou recupere sua senha.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'Login com Google cancelado. Clique novamente para entrar.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou o pop-up de login. Permita pop-ups para este site e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'O provedor E-mail/Senha ainda não foi ativado no Firebase Console (Authentication > Sign-in method > E-mail/senha).';
    default:
      return 'Não foi possível autenticar. Verifique sua conexão e tente novamente.';
  }
}

export const AuthGate: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMsg(translateFirebaseAuthError(err));
      console.error('Google Sign-In error:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      try {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setSuccessMsg(
          `Enviamos um link de redefinição de senha para ${trimmedEmail}. Verifique sua caixa de entrada e spam.`
        );
      } catch (err) {
        setErrorMsg(translateFirebaseAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      const trimmedName = displayName.trim();
      if (!trimmedName) {
        setErrorMsg('Informe seu nome para identificar sua conta.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }

      setIsSubmitting(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(cred.user, {
          displayName: trimmedName.slice(0, 120),
        });
        await sendEmailVerification(cred.user);
      } catch (err) {
        setErrorMsg(translateFirebaseAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // mode === 'login'
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
    } catch (err) {
      setErrorMsg(translateFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              365
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">
                Desafio dos 365 Depósitos
              </span>
              <span className="text-[11px] text-slate-400 block">
                Meta R$ 30.000,00 · Sistema Individual com Dados Isolados
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Acesso Seguro</span>
          </div>
        </div>
      </header>

      {/* Main Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold mb-3">
              <Cloud className="w-3.5 h-3.5" />
              <span>Conta Individual Protegida no Firestore</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {mode === 'login' && 'Acesse sua Conta do Desafio 365'}
              {mode === 'register' && 'Criar Conta Individual Gratuita'}
              {mode === 'reset' && 'Recuperar Senha da Conta'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {mode === 'login' &&
                'Entre com seu e-mail e senha ou sua conta Google para acessar seu saldo, histórico e grade de 365 depósitos.'}
              {mode === 'register' &&
                'Cada pessoa cria sua própria conta com seus 365 quadrinhos, saldo e histórico isolados com segurança.'}
              {mode === 'reset' &&
                'Informe o e-mail cadastrado para receber o link seguro de redefinição de senha do Firebase Auth.'}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Mode Switcher */}
            {mode !== 'reset' ? (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Entrar</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Criar Conta</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o login</span>
              </button>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={120}
                    required
                    placeholder="Ex: Maria Silva"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    required
                    autoComplete="email"
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset')}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                      autoComplete="new-password"
                      placeholder="Digite a senha novamente"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>
                    {mode === 'login' && 'Entrar com E-mail e Senha'}
                    {mode === 'register' && 'Criar Minha Conta'}
                    {mode === 'reset' && 'Enviar Link de Recuperação'}
                  </span>
                )}
              </button>
            </form>

            {/* Divider + Preserved Google Sign-In */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink-0 mx-3 text-[11px] font-medium text-slate-400">
                ou acesse com
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Conectando com Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.7H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M3.3 7.5l3.2 2.3C7.4 7.8 9.5 6.3 12 6.3c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2.2 12 2.2c-3.8 0-7.1 2.1-8.7 5.3z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12 21.8c2.6 0 4.8-.9 6.4-2.3l-3-2.5c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2l-3.2 2.5c1.6 3.2 4.9 5.5 8.8 5.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M21.4 12.2c0-.6-.1-1.1-.2-1.7H12v3.9h5.4c-.3 1.4-1.1 2.5-2.1 3.2l3 2.5c1.8-1.6 3.1-4.1 3.1-7.9z"
                    />
                  </svg>
                  <span>Entrar com Google</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 text-center">
              <div className="flex flex-col items-center gap-1">
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                <span>365 Depósitos</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Painel Individual</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dados Isolados</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface EmailVerificationGateProps {
  user: User;
  onVerified: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const EmailVerificationGate: React.FC<EmailVerificationGateProps> = ({
  user,
  onVerified,
  onSignOut,
}) => {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckVerified = async () => {
    setChecking(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await user.reload();
      await user.getIdToken(true);
      if (auth.currentUser?.emailVerified) {
        await onVerified();
      } else {
        setErrorMsg(
          'Seu e-mail ainda consta como não verificado. Clique no link enviado para sua caixa de entrada (ou spam) e tente novamente.'
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao verificar status do e-mail. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await sendEmailVerification(user);
      setStatusMsg(`Novo e-mail de confirmação enviado para ${user.email}.`);
    } catch (err) {
      setErrorMsg(translateFirebaseAuthError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-slate-900 text-white p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-3">
            <Mail className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-lg font-extrabold">Confirme seu E-mail para Continuar</h1>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Por segurança, as regras do Firestore exigem e-mail verificado antes de liberar o acesso individual aos seus depósitos.
          </p>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Conta conectada:</span>
            <span className="font-bold text-slate-900">{user.email}</span>
          </div>

          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleCheckVerified}
            disabled={checking}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Já confirmei meu e-mail — Entrar</span>
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-800 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {resending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
          </button>

          <button
            onClick={onSignOut}
            className="w-full py-2 px-4 text-rose-600 hover:bg-rose-50 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair e usar outra conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
