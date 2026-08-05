import React, { useState } from 'react';
import { User, UserRole } from '../types/nursing';

/* A senha não é mais definida aqui: quem cria o acesso é o sistema do hospital. */
const semSenha = (_?: string) => '';
import { Users, X, UserPlus, Trash2, Edit3, Check, KeyRound } from 'lucide-react';

interface UserManagementModalProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  users,
  currentUser,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onClose
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Enfermeiro(a)');
  const [coren, setCoren] = useState('');
  const [birthDate, setBirthDate] = useState('1990-06-15');
  const [errorMsg, setErrorMsg] = useState('');

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Enfermeiro(a)');
  const [editCoren, setEditCoren] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editPin, setEditPin] = useState('');

  const ddmm = semSenha(birthDate);
  const isAdmin = currentUser.username === 'admin' || currentUser.role === 'Admin' || currentUser.role === 'Coordenador(a) de Enfermagem';

  const handleStartEdit = (u: User) => {
    setEditingUserId(u.id);
    setEditName(u.name);
    setEditRole(u.role);
    setEditCoren(u.coren || '');
    setEditBirthDate(u.birthDate || '1990-06-15');
    setEditPin(u.pin || semSenha(u.birthDate));
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveEdit = (u: User) => {
    if (!editName.trim()) {
      setErrorMsg('Informe o nome do profissional.');
      return;
    }
    const newDdmm = semSenha(editBirthDate);
    const updatedUser: User = {
      ...u,
      name: editName.trim(),
      role: editRole,
      coren: editCoren.trim() ? editCoren.trim() : undefined,
      birthDate: editBirthDate,
      username: u.username === 'admin' ? 'admin' : (newDdmm || u.username),
      pin: editPin.trim() ? editPin.trim() : u.pin
    };

    onEditUser(updatedUser);
    setEditingUserId(null);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Apenas o Administrador pode cadastrar novos profissionais.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Digite o nome do profissional.');
      return;
    }
    if (!birthDate) {
      setErrorMsg('Informe a data de nascimento.');
      return;
    }

    onAddUser({
      name: name.trim(),
      role,
      coren: coren.trim() ? coren.trim() : undefined,
      birthDate,
      username: ddmm,
      pin: ddmm
    });

    setName('');
    setCoren('');
    setBirthDate('1990-06-15');
    setShowAddForm(false);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-900 rounded-lg text-emerald-300 border border-emerald-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Equipe de Enfermagem</h2>
              <p className="text-xs text-emerald-200">Hospital Municipal Maria Veneri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Profissionais Cadastrados ({users.length})
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showAddForm ? 'Cancelar' : 'Novo Integrante'}
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-2.5 rounded-xl">
              ℹ️ Apenas o <strong>Administrador</strong> possui permissão para cadastrar ou excluir integrantes da equipe.
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase pb-1 border-b border-slate-200">
                Adicionar Profissional
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Enfª Helena Souza"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Cargo</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Coordenador(a) de Enfermagem">Coordenador(a) de Enfermagem</option>
                    <option value="Enfermeiro(a)">Enfermeiro(a)</option>
                    <option value="Técnico(a) de Enfermagem">Técnico(a) de Enfermagem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">COREN</label>
                  <input
                    type="text"
                    value={coren}
                    onChange={(e) => setCoren(e.target.value)}
                    placeholder="COREN-PE 123.456-ENF"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-[11px] text-emerald-900 font-medium">
                Login e Senha Padrão (DDMM): <span className="font-bold font-mono text-xs">{ddmm}</span>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 rounded-xl text-xs transition-colors"
              >
                Salvar Cadastro
              </button>
            </form>
          )}

          {/* User List */}
          <div className="space-y-2">
            {users.map((u) => {
              const isEditing = editingUserId === u.id;
              const loginDdmm = u.username || semSenha(u.birthDate);

              if (isEditing) {
                return (
                  <div key={u.id} className="p-3.5 bg-sky-50 border border-sky-300 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-sky-200 pb-1.5">
                      <span className="text-xs font-bold text-sky-950 uppercase flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-sky-700" />
                        Editar Profissional: {u.name}
                      </span>
                      <span className="text-[10px] font-mono bg-sky-200 text-sky-900 px-1.5 py-0.5 rounded">
                        ID: {u.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Cargo</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="Coordenador(a) de Enfermagem">Coordenador(a) de Enfermagem</option>
                          <option value="Enfermeiro(a)">Enfermeiro(a)</option>
                          <option value="Técnico(a) de Enfermagem">Técnico(a) de Enfermagem</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">COREN</label>
                        <input
                          type="text"
                          value={editCoren}
                          onChange={(e) => setEditCoren(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Data de Nascimento</label>
                        <input
                          type="date"
                          value={editBirthDate}
                          onChange={(e) => setEditBirthDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          Senha / PIN (4 Dígitos)
                        </label>
                        <input
                          type="text"
                          value={editPin}
                          onChange={(e) => setEditPin(e.target.value)}
                          placeholder="Ex: 1506"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-sky-200">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(u)}
                        className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {u.name}
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold">
                          Login: {loginDdmm}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-emerald-900">{u.role}</span>
                        {u.coren && <span className="font-mono text-slate-400">• {u.coren}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => handleStartEdit(u)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 rounded hover:bg-emerald-50 transition-colors"
                        title="Editar Profissional"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && u.id !== currentUser.id && (
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Remover Profissional"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
