import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole, Signature } from '../types';
import { Plus, Search, Edit2, Trash2, Shield, Users, Save, X, Key, Briefcase, IdCard, PenTool } from 'lucide-react';

interface UserManagementScreenProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  availableSignatures: Signature[]; // Recebe assinaturas disponíveis
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  availableSignatures
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    role: 'collaborator',
    sector: '',
    jobTitle: '',
    allowedSignatureIds: []
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ ...user, allowedSignatureIds: user.allowedSignatureIds || [] }); 
    } else {
      setEditingUser(null);
      setFormData({ name: '', username: '', password: '', role: 'collaborator', sector: '', jobTitle: '', allowedSignatureIds: [] });
    }
    setIsModalOpen(true);
  };

  const toggleSignaturePermission = (sigId: string) => {
    setFormData(prev => {
        const currentIds = prev.allowedSignatureIds || [];
        if (currentIds.includes(sigId)) {
            return { ...prev, allowedSignatureIds: currentIds.filter(id => id !== sigId) };
        } else {
            return { ...prev, allowedSignatureIds: [...currentIds, sigId] };
        }
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.username || !formData.password) {
      alert("Por favor, preencha nome, usuário e senha.");
      return;
    }

    const userData = {
      id: editingUser ? editingUser.id : Date.now().toString(),
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: formData.role as UserRole,
      sector: formData.sector || '',
      jobTitle: formData.jobTitle || '',
      allowedSignatureIds: formData.allowedSignatureIds || []
    };

    if (editingUser) {
      onUpdateUser(userData);
    } else {
      onAddUser(userData);
    }
    setIsModalOpen(false);
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

  // Ordena assinaturas por nome para exibição
  const sortedSignatures = [...availableSignatures].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex-1 h-full bg-slate-100 p-6 md:p-12 overflow-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão de Usuários</h2>
            <p className="text-slate-500 mt-1">Gerencie acessos, permissões e cargos da equipe.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Usuário
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, login, setor ou cargo..." 
            className="flex-1 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Grid */}
        <div className="grid gap-4">
           {filteredUsers.map(user => (
             <div key={user.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${
                     user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 
                     user.role === 'licitacao' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3" /> @{user.username}
                      </span>
                      {user.jobTitle && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-600">
                           <IdCard className="w-3 h-3" /> {user.jobTitle}
                        </span>
                      )}
                      {user.sector && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded text-xs font-medium border border-slate-100">
                          <Briefcase className="w-3 h-3" /> {user.sector}
                        </span>
                      )}
                    </div>
                    {/* Badge de assinaturas permitidas */}
                    {(user.allowedSignatureIds?.length || 0) > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                            <PenTool className="w-3 h-3" />
                            {user.allowedSignatureIds?.length} assinatura(s) permitida(s)
                        </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto pl-16 md:pl-0">
                   <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      user.role === 'licitacao' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                   }`}>
                      {user.role === 'admin' ? 'Administrador' : user.role === 'licitacao' ? 'Licitação' : 'Colaborador'}
                   </div>

                   <div className="flex items-center gap-1 border-l border-slate-100 pl-3 ml-2">
                     <button 
                       onClick={() => handleOpenModal(user)}
                       className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                       title="Editar"
                     >
                       <Edit2 className="w-4 h-4" />
                     </button>
                     {user.username !== 'admin' && (
                       <button 
                         onClick={() => onDeleteUser(user.id)}
                         className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                         title="Excluir"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Modal de Edição/Criação via Portal */}
        {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>Nome Completo</label>
                      <input 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className={inputClass}
                        placeholder="Ex: Ana Silva"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Usuário (Login)</label>
                      <input 
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        className={inputClass}
                        placeholder="usuario.login"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Senha</label>
                      <input 
                        type="text" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className={inputClass}
                        placeholder="******"
                      />
                    </div>
                    
                    <div>
                      <label className={labelClass}>Permissão</label>
                      <select 
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                        className={inputClass}
                      >
                         <option value="collaborator">Colaborador</option>
                         <option value="licitacao">Licitação (View Only)</option>
                         <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Cargo</label>
                      <input 
                        value={formData.jobTitle}
                        onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                        className={inputClass}
                        placeholder="Ex: Gerente Comercial"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Setor / Departamento</label>
                      <input 
                        value={formData.sector}
                        onChange={e => setFormData({...formData, sector: e.target.value})}
                        className={inputClass}
                        placeholder="Ex: Financeiro"
                      />
                    </div>
                 </div>

                 {/* Seção de Permissões de Assinatura */}
                 <div className="border-t border-slate-100 pt-6">
                    <label className={`${labelClass} mb-3 flex items-center gap-2 text-indigo-600`}>
                        <PenTool className="w-4 h-4" />
                        Assinaturas Permitidas
                    </label>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        {sortedSignatures.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {sortedSignatures.map(sig => {
                                    const isChecked = formData.allowedSignatureIds?.includes(sig.id);
                                    return (
                                        <label key={sig.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                            isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-100'
                                        }`}>
                                            <input 
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleSignaturePermission(sig.id)}
                                                className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">{sig.name}</div>
                                                <div className="text-xs text-slate-500">{sig.role}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-2">Nenhuma assinatura cadastrada no sistema.</p>
                        )}
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={handleSave}
                   className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                 >
                   <Save className="w-4 h-4" />
                   Salvar Usuário
                 </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>
    </div>
  );
};