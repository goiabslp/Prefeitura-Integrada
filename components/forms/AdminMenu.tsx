
import React from 'react';
import { Users, User as UserIcon, PenTool, Home, Palette } from 'lucide-react';
import { User } from '../../types';

interface AdminMenuProps {
  currentUser: User;
  onTabChange: (tab: string) => void;
}

export const AdminMenu: React.FC<AdminMenuProps> = ({ currentUser, onTabChange }) => {
  const adminModules = [
    { 
      id: 'users', 
      title: currentUser.role === 'admin' ? 'Usuários' : 'Meu Perfil', 
      description: currentUser.role === 'admin' ? 'Gerencie acessos e equipe' : 'Configure seus dados de acesso', 
      icon: currentUser.role === 'admin' ? <Users className="w-6 h-6 text-indigo-600" /> : <UserIcon className="w-6 h-6 text-indigo-600" />, 
      colorClass: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300 shadow-sm' 
    },
    { 
      id: 'signatures', 
      title: 'Assinaturas', 
      description: currentUser.role === 'admin' ? 'Cadastre assinantes do sistema' : 'Visualize assinaturas disponíveis', 
      icon: <PenTool className="w-6 h-6 text-emerald-600" />, 
      colorClass: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 shadow-sm' 
    },
    { 
      id: 'ui', 
      title: 'Interface', 
      description: 'Personalize a tela inicial', 
      icon: <Home className="w-6 h-6 text-blue-600" />, 
      colorClass: 'bg-blue-50 border-blue-100 hover:border-blue-300 shadow-sm', 
      adminOnly: true 
    },
    { 
      id: 'design', 
      title: 'Design Doc', 
      description: 'Identidade visual do PDF', 
      icon: <Palette className="w-6 h-6 text-purple-600" />, 
      colorClass: 'bg-purple-50 border-purple-100 hover:border-purple-300 shadow-sm', 
      adminOnly: true 
    }
  ].filter(mod => !mod.adminOnly || currentUser.role === 'admin');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminModules.map((mod) => (
          <button 
            key={mod.id} 
            onClick={() => onTabChange(mod.id)} 
            className={`p-6 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4 ${mod.colorClass}`}
          >
            <div className="p-3 bg-white rounded-xl w-fit shadow-sm">{mod.icon}</div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{mod.title}</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium opacity-80">{mod.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
