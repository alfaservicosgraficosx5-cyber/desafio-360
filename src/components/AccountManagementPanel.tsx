import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Share2,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

interface AccountManagementPanelProps {
  user: User;
  onSignOut: () => Promise<void>;
}

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui uma conta cadastrada. Use "Sair / Trocar de Conta" para entrar com ele.';
    case 'auth/invalid-email':
      return 'O e-mail informado é inválido.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'O provedor E-mail/Senha precisa estar ativado no Firebase Console (Authentication > Sign-in method > E-mail/senha).';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
    default:
      return 'Não foi possível criar a nova conta. Verifique os dados e tente novamente.';
  }
}

export const AccountManagementPanel: React.FC<AccountManagementPanelProps> = ({
  user,
  onSignOut,
}) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com');
  const appShareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyShareLink = () => {
    if (!appShareUrl) return;
    navigator.clipboard.writeText(appShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendPasswordReset = async () => {
    if (!user.email) return;
    setSendingReset(true);
    setResetMsg(null);
    setErrorMsg(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetMsg(`Link de redefinição de senha enviado para ${user.email}.`);
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setSendingReset(false);
    }
  };

  const handleCreateAnotherAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetMsg(null);

    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim();

    if (!trimmedName) {
      setErrorMsg('Informe o nome da pessoa.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (trimmedEmail.toLowerCase() === (user.email || '').toLowerCase()) {
      setErrorMsg('Informe um e-mail diferente da sua conta atual.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setCreating(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, newPassword);
      await updateProfile(cred.user, {
        displayName: trimmedName.slice(0, 120),
      });
      await sendEmailVerification(cred.user);
      await cred.user.reload();
    } catch (err) {
      setErrorMsg(mapAuthError(err));
      setCreating(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Minha Conta Atual */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Minha Conta Conectada</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                Verificada
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuário'}
                  className="w-11 h-11 rounded-full border border-slate-300 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {user.displayName || 'Participante'}
                </div>
                <div className="text-xs text-slate-600 truncate">{user.email}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  ID: {user.uid}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Método de acesso:</span>
                <span className="font-semibold text-slate-800">
                  {isGoogleUser ? 'Google Sign-In' : 'E-mail e Senha'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Isolamento dos dados:</span>
                <span className="font-semibold text-emerald-700">Privado no Firestore</span>
              </div>
            </div>

            {resetMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{resetMsg}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {!isGoogleUser && (
              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={sendingReset}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>{sendingReset ? 'Enviando...' : 'Enviar E-mail para Alterar Senha'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sair / Trocar de Conta</span>
            </button>
          </div>
        </div>

        {/* Card 2: Criar Conta para Outra Pessoa da Família */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Criar Conta para Outra Pessoa da Família</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadastre um novo e-mail e senha individuais para que outra pessoa tenha seu próprio desafio, saldo e histórico separados.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateAnotherAccount} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nome da Pessoa
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="Ex: Maria Souza"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  E-mail da Pessoa
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    maxLength={254}
                    required
                    placeholder="maria@exemplo.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Senha (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                    placeholder="Crie uma senha"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

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
                    placeholder="Repita a senha"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
              Ao cadastrar uma nova conta por aqui, seus dados atuais ficam salvos no Firestore e a sessão será trocada para a nova conta recém-criada (que receberá um e-mail de confirmação).
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando nova conta...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Nova Conta Individual</span>
                </>
              )}
            </button>
          </form>

          {/* Share link so each person creates on their own phone */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Ou envie o link para cada familiar criar a conta no próprio celular:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appShareUrl}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Ao abrir o link, cada pessoa verá a aba &ldquo;Criar Conta&rdquo; para cadastrar o próprio e-mail e senha ou entrar com Google.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
