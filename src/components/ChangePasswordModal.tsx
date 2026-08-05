import React, { useState } from 'react';
import { User } from '../types/nursing';
import { KeyRound, Lock, CheckCircle2, X, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  currentUser: User;
  onUpdatePassword: (userId: string, newPin: string) => void;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  currentUser,
  onUpdatePassword,
  onClose
}) => {
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (currentUser.pin && currentPinInput !== currentUser.pin) {
      setErrorMsg('Senha atual incorreta.');
      return;
    }

    if (!newPinInput || newPinInput.length < 4) {
      setErrorMsg('A nova senha deve ter no mínimo 4 dígitos.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setErrorMsg('A confirmação da senha não confere.');
      return;
    }

    onUpdatePassword(currentUser.id, newPinInput);
    setSuccessMsg('Senha alterada com sucesso!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Alterar Senha de Acesso</h3>
              <p className="text-[11px] text-slate-500">{currentUser.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Senha Atual (DDMM)</label>
            <input
              type="password"
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value)}
              placeholder="Digite sua senha atual"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nova Senha</label>
            <input
              type="password"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="Digite a nova senha"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Salvar Nova Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
