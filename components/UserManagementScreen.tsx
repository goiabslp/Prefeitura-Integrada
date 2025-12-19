
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole, Signature, AppPermission } from '../types';
import { Plus, Search, Edit2, Trash2, Shield, Users, Save, X, Key, Briefcase, IdCard, PenTool, LayoutGrid } from 'lucide-react';

interface UserManagementScreenProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  availableSignatures: Signature[]; 
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

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    role: 'collaborator',
    sector: '',
    jobTitle: '',
    allowedSignatureIds: [],
    permissions: ['parent_criar_oficio']
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
      setFormData({ 
        ...user, 
        allowedSignatureIds: user.allowedSignatureIds || [],
        permissions: user.permissions || []
      }); 
    } else {
      setEditingUser(null);
      setFormData({ 
        name: '', 
        username: '', 
        password: '', 
        role: 'collaborator', 
        sector: '', 
        jobTitle: '', 
        allowedSignatureIds: [],
        permissions: ['parent_criar_oficio']
      });
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

  const toggleAppPermission = (perm: AppPermission) => {
    setFormData(prev => {
        const currentPerms = prev.permissions || [];
        if (currentPerms.includes(perm)) {
            return { ...prev, permissions: currentPerms.filter(p => p !== perm) };
        } else {
            return { ...prev, permissions: [...currentPerms, perm] };
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
      allowedSignatureIds: formData.allowedSignatureIds || [],
      permissions: formData.permissions || []
    } as User;

    if (editingUser) {
      onUpdateUser(userData);
    } else {
      onAddUser(userData);
    }
    setIsModalOpen(false);
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

  const permissionsList: { id: AppPermission, label: string }[] = [
    { id: 'parent_criar_oficio', label: 'Bloco Pai: Ofícios' },
    { id: 'parent_compras', label: 'Bloco Pai: Compras' },
    { id: 'parent_licitacao', label: 'Bloco Pai: Licitação' },
    { id: 'parent_diarias', label: 'Bloco Pai: Diárias e Custeio' },
    { id: 'parent_admin', label: 'Bloco Pai: Administração' }
  ];

  return (
    <div className="flex-1 h-full bg-slate-100 p-6 md:p-12 overflow-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão de Usuários</h2>
            <p className="text-slate-500 mt-1">Configuração de acessos aos blocos pai do sistema.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Usuário
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar usuário..." 
            className="flex-1 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
                      <span className="flex items-center gap-1"><Key className="w-3 h-3" /> @{user.username}</span>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-600">
                         {user.jobTitle || 'Usuário'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.permissions?.map(p => (
                        <span key={p} className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-indigo-600 px-2 py-1 rounded border border-indigo-100">
                          {p === 'parent_criar_oficio' ? 'OFÍCIO' : p === 'parent_compras' ? 'COMPRAS' : p === 'parent_licitacao' ? 'LICITAÇÃO' : p === 'parent_diarias' ? 'DIÁRIAS' : 'ADMIN'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1">
                     <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                     {user.username !== 'admin' && (
                       <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                     )}
                   </div>
                </div>
             </div>
           ))}
        </div>

        {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>Nome Completo</label>
                      <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Usuário</label>
                      <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Senha</label>
                      <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={inputClass} />
                    </div>
                 </div>

                 <div className="border-t border-slate-100 pt-6">
                    <label className={`${labelClass} mb-3 flex items-center gap-2 text-indigo-600`}><LayoutGrid className="w-4 h-4" /> Atribuição de Blocos Pai</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {permissionsList.map(perm => {
                            const isChecked = formData.permissions?.includes(perm.id);
                            return (
                                <label key={perm.id} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input type="checkbox" checked={isChecked} onChange={() => toggleAppPermission(perm.id)} className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">{perm.label}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">Habilita o acesso total a este módulo</span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                 </div>

                 <div className="border-t border-slate-100 pt-6">
                    <label className={`${labelClass} mb-3 flex items-center gap-2 text-indigo-600`}><PenTool className="w-4 h-4" /> Assinaturas Permitidas</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableSignatures.map(sig => {
                            const isChecked = formData.allowedSignatureIds?.includes(sig.id);
                            return (
                                <label key={sig.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                                    <input type="checkbox" checked={isChecked} onChange={() => toggleSignaturePermission(sig.id)} className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{sig.name}</div>
                                        <div className="text-xs text-slate-500">{sig.role}</div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                 <button onClick={handleSave} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-lg flex items-center gap-2"><Save className="w-4 h-4" /> Salvar Usuário</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
