
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole, Signature, AppPermission, Job, Sector } from '../types';
import { 
  Plus, Search, Edit2, Trash2, ShieldCheck, Users, Save, X, Key, 
  PenTool, LayoutGrid, User as UserIcon, CheckCircle2, Gavel, ShoppingCart, Briefcase, Network 
} from 'lucide-react';

interface UserManagementScreenProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  availableSignatures: Signature[]; 
  jobs: Job[];
  sectors: Sector[];
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  availableSignatures,
  jobs,
  sectors
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const isAdmin = currentUser.role === 'admin';

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

  const filteredUsers = isAdmin 
    ? users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users.filter(u => u.id === currentUser.id);

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

  const handleRoleChange = (newRole: UserRole) => {
    if (!isAdmin) return;
    
    let updatedPermissions = [...(formData.permissions || [])];
    
    if (newRole !== 'admin' && newRole !== 'compras') {
      updatedPermissions = updatedPermissions.filter(p => p !== 'parent_compras_pedidos');
    }
    
    setFormData({
      ...formData, 
      role: newRole,
      permissions: updatedPermissions
    });
  };

  const toggleSignaturePermission = (sigId: string) => {
    if (!isAdmin) return;
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
    if (!isAdmin) return;
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

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed";
  const selectClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

  const permissionsList: { id: AppPermission, label: string }[] = [
    { id: 'parent_criar_oficio', label: 'Módulo: Ofícios' },
    { id: 'parent_compras', label: 'Módulo: Compras' },
    { id: 'parent_licitacao', label: 'Módulo: Licitação' },
    { id: 'parent_diarias', label: 'Módulo: Diárias e Custeio' },
    { id: 'parent_admin', label: 'Administrativo' },
    { id: 'parent_compras_pedidos', label: 'Gestão de Pedidos (Compras)' }
  ];

  return (
    <div className="flex-1 h-full bg-slate-100 p-6 md:p-12 overflow-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{isAdmin ? 'Gestão de Usuários' : 'Meu Perfil'}</h2>
            <p className="text-slate-500 mt-1">{isAdmin ? 'Configuração de acessos e permissões da equipe.' : 'Gerencie seus dados pessoais de acesso ao sistema.'}</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => handleOpenModal()}
              className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Usuário
            </button>
          )}
        </div>

        {isAdmin && (
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
        )}

        <div className="grid gap-4">
           {filteredUsers.map(user => (
             <div key={user.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${
                     user.role === 'admin' ? 'bg-indigo-600 text-white' : 
                     (user.role === 'licitacao' || user.role === 'compras') ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
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
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                        user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 
                        user.role === 'licitacao' ? 'bg-blue-100 text-blue-700' : 
                        user.role === 'compras' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                         {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1">
                     <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                     {isAdmin && user.username !== 'admin' && user.id !== currentUser.id && (
                       <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                     )}
                   </div>
                </div>
             </div>
           ))}
        </div>

        {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">{isAdmin ? (editingUser ? 'Editar Usuário' : 'Novo Usuário') : 'Meu Perfil'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                 <div className="space-y-4">
                    <label className={labelClass}>Tipo de Perfil</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       {[
                         { id: 'admin', label: 'Admin', desc: 'Acesso total.', icon: <ShieldCheck className="w-5 h-5" />, color: 'indigo' },
                         { id: 'licitacao', label: 'Licitação', desc: 'Módulos sem Admin.', icon: <Gavel className="w-5 h-5" />, color: 'blue' },
                         { id: 'compras', label: 'Compras', desc: 'Módulos + Visão.', icon: <ShoppingCart className="w-5 h-5" />, color: 'emerald' },
                         { id: 'collaborator', label: 'Colaborador', desc: 'Operação básica.', icon: <UserIcon className="w-5 h-5" />, color: 'slate' }
                       ].map((role) => {
                         const isSelected = formData.role === role.id;
                         const canEditRole = isAdmin;
                         
                         return (
                           <button
                             key={role.id}
                             type="button"
                             disabled={!canEditRole}
                             onClick={() => handleRoleChange(role.id as UserRole)}
                             className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group ${
                               isSelected 
                                 ? `bg-${role.color}-50 border-${role.color}-600 ring-4 ring-${role.color}-600/10` 
                                 : `bg-white border-slate-100 hover:border-slate-300 ${!canEditRole ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`
                             }`}
                           >
                             <div className="flex items-start justify-between">
                                <div className={`p-2 rounded-xl transition-colors ${
                                  isSelected ? `bg-${role.color}-600 text-white` : `bg-slate-100 text-slate-400 group-hover:bg-emerald-100`
                                }`}>
                                   {role.icon}
                                </div>
                                {isSelected && <CheckCircle2 className={`w-4 h-4 text-${role.color}-600 animate-fade-in`} />}
                             </div>
                             <div className="mt-3">
                                <h4 className={`font-bold text-sm ${isSelected ? `text-${role.color}-900` : 'text-slate-800'}`}>{role.label}</h4>
                                <p className="text-[10px] mt-0.5 leading-tight text-slate-500">{role.desc}</p>
                             </div>
                           </button>
                         );
                       })}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Nome Completo</label>
                      <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="Ex: Nome do Colaborador" />
                    </div>
                    <div>
                      <label className={labelClass}>Usuário de Acesso</label>
                      <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={inputClass} disabled={!isAdmin} placeholder="ex: nome.sobrenome" />
                    </div>
                    <div>
                      <label className={labelClass}>Senha</label>
                      <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={inputClass} placeholder="Senha segura" />
                    </div>
                    
                    <div className="relative">
                      <label className={labelClass}>Cargo / Função</label>
                      <div className="relative group">
                        <select 
                          value={formData.jobTitle} 
                          onChange={e => setFormData({...formData, jobTitle: e.target.value})} 
                          className={selectClass}
                          disabled={!isAdmin}
                        >
                          <option value="">Selecione um Cargo</option>
                          {jobs.sort((a, b) => a.name.localeCompare(b.name)).map(j => (
                            <option key={j.id} value={j.name}>{j.name}</option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                           <Briefcase className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <label className={labelClass}>Setor</label>
                      <div className="relative group">
                        <select 
                          value={formData.sector} 
                          onChange={e => setFormData({...formData, sector: e.target.value})} 
                          className={selectClass}
                          disabled={!isAdmin}
                        >
                          <option value="">Selecione um Setor</option>
                          {sectors.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                           <Network className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="border-t border-slate-100 pt-8">
                    <label className={`${labelClass} mb-4 flex items-center gap-2 text-indigo-600`}><LayoutGrid className="w-4 h-4" /> Módulos Autorizados</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {permissionsList.map(perm => {
                            const isChecked = formData.permissions?.includes(perm.id);
                            const isPurchaseManagement = perm.id === 'parent_compras_pedidos';
                            const isAllowedForRole = isAdmin && (!isPurchaseManagement || (formData.role === 'admin' || formData.role === 'compras'));

                            return (
                                <label 
                                  key={perm.id} 
                                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all 
                                    ${!isAllowedForRole ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}
                                    ${isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}
                                  `}
                                >
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked} 
                                      disabled={!isAllowedForRole}
                                      onChange={() => toggleAppPermission(perm.id)} 
                                      className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500" 
                                    />
                                    <span className="text-xs font-bold text-slate-700">{perm.label}</span>
                                </label>
                            );
                        })}
                    </div>
                 </div>

                 <div className="border-t border-slate-100 pt-8">
                    <label className={`${labelClass} mb-4 flex items-center gap-2 text-indigo-600`}><PenTool className="w-4 h-4" /> Assinaturas Permitidas</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableSignatures.map(sig => {
                            const isChecked = formData.allowedSignatureIds?.includes(sig.id);
                            return (
                                <label key={sig.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${!isAdmin ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'cursor-pointer'} ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                    <input type="checkbox" checked={isChecked} disabled={!isAdmin} onChange={() => toggleSignaturePermission(sig.id)} className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <div>
                                        <div className="font-bold text-xs text-slate-800">{sig.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-medium">{sig.role}</div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                 <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-xl flex items-center gap-2 transition-all"><Save className="w-5 h-5" /> {isAdmin ? 'Salvar Usuário' : 'Salvar Alterações'}</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
