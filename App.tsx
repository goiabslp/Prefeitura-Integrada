
import React, { useState, useRef, useEffect } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { DocumentPreview } from './components/DocumentPreview';
import { HomeScreen } from './components/HomeScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementScreen } from './components/UserManagementScreen';
import { SignatureManagementScreen } from './components/SignatureManagementScreen';
import { UIPreviewScreen } from './components/UIPreviewScreen';
import { INITIAL_STATE, DEFAULT_USERS, MOCK_SIGNATURES } from './constants';
import { AppState, User, Order, Signature } from './types';
import { Menu, FileText, FileDown, Edit3, Check, Loader2, LayoutDashboard, ArrowLeft, LogOut, AlertTriangle, X, Info } from 'lucide-react';
import * as db from './services/dbService';
import { createPortal } from 'react-dom';

declare var html2pdf: any;

const STORAGE_KEY = 'branddoc_settings_v2';
const COUNTER_KEY = 'branddoc_oficio_counter_global';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  
  const [globalDefaults, setGlobalDefaults] = useState<AppState>(INITIAL_STATE);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [oficioCounter, setOficioCounter] = useState<number>(0);
  
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'tracking' | 'admin'>('home');
  const [adminTab, setAdminTab] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);

  // Carregamento Inicial com Persistência em Banco
  useEffect(() => {
    const loadData = async () => {
      // 1. Configurações Visuais
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setGlobalDefaults(parsedSettings);
          setAppState(parsedSettings);
        } catch (e) {
          console.error("Erro ao carregar configurações salvas:", e);
        }
      }

      // 2. Contador Global
      const savedCounter = localStorage.getItem(COUNTER_KEY);
      if (savedCounter) {
        setOficioCounter(parseInt(savedCounter, 10));
      }

      // 3. Usuários e Assinaturas (Seeding se necessário)
      try {
        let dbUsers = await db.getAllUsers();
        if (dbUsers.length === 0) {
          for (const u of DEFAULT_USERS) {
            await db.saveUser(u);
          }
          dbUsers = DEFAULT_USERS;
        }
        setUsers(dbUsers);

        let dbSigs = await db.getAllSignatures();
        if (dbSigs.length === 0) {
          for (const s of MOCK_SIGNATURES) {
            await db.saveSignature(s);
          }
          dbSigs = MOCK_SIGNATURES;
        }
        setSignatures(dbSigs);

        const dbOrders = await db.getAllOrders();
        setOrders(dbOrders);
      } catch (e) {
        console.error("Erro ao carregar dados do banco:", e);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleLogin = (username: string, pass: string): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === pass);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setAppState(globalDefaults);
    setIsFinalized(false);
    setCurrentOrder(null);
  };

  const handleStartNewOrder = () => {
    let initialSigName = currentUser?.name || '';
    let initialSigRole = currentUser?.jobTitle || (currentUser?.role === 'admin' ? 'Administrador' : 'Colaborador');
    let initialSigSector = currentUser?.sector || '';

    if (currentUser?.allowedSignatureIds && currentUser.allowedSignatureIds.length > 0) {
        const firstSig = signatures.find(s => s.id === currentUser.allowedSignatureIds![0]);
        if (firstSig) {
            initialSigName = firstSig.name;
            initialSigRole = firstSig.role;
            initialSigSector = firstSig.sector;
        }
    }

    const nextNumber = oficioCounter + 1;
    setOficioCounter(nextNumber);
    localStorage.setItem(COUNTER_KEY, nextNumber.toString());

    const currentYear = new Date().getFullYear();
    const protocolNumber = nextNumber.toString().padStart(3, '0');
    const protocolStr = `${protocolNumber}/${currentYear}`;

    setAppState({
      ...globalDefaults,
      content: {
        ...globalDefaults.content,
        signatureName: initialSigName,
        signatureRole: initialSigRole,
        signatureSector: initialSigSector,
        title: '',
        body: globalDefaults.content.body,
        leftBlockText: `Ofício nº ${protocolStr}\nAssunto: `
      },
      document: {
        ...globalDefaults.document,
        showSignature: true,
        showLeftBlock: true,
        showRightBlock: true
      }
    });
    setAdminTab('content');
    setCurrentView('editor');
    setIsSidebarOpen(true);
    setIsFinalized(false);
    setCurrentOrder(null);
  };

  const handleEditOrder = (order: Order) => {
    if (order.documentSnapshot) {
      setAppState(JSON.parse(JSON.stringify(order.documentSnapshot)));
      setIsFinalized(false);
      setIsSidebarOpen(true);
      setAdminTab('content');
      setCurrentView('editor');
      setCurrentOrder(order);
    } else {
      showToast("Este registro não possui dados de edição salvos.", "error");
    }
  };

  const handleFinishDocument = async () => {
    if (!currentUser) return;
    
    let orderToSave: Order;

    if (currentOrder) {
      orderToSave = {
        ...currentOrder,
        title: appState.content.title || 'Documento sem título',
        createdAt: new Date().toISOString(),
        documentSnapshot: JSON.parse(JSON.stringify(appState))
      };
    } else {
      const protocolMatch = appState.content.leftBlockText.match(/Ofício nº (\d+\/\d+)/);
      const protocolStr = protocolMatch ? protocolMatch[1] : `${oficioCounter.toString().padStart(3, '0')}/${new Date().getFullYear()}`;

      orderToSave = {
        id: Date.now().toString(),
        protocol: protocolStr,
        title: appState.content.title || 'Documento sem título',
        status: 'completed',
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        documentSnapshot: JSON.parse(JSON.stringify(appState))
      };
    }

    try {
      await db.saveOrder(orderToSave);
      const updatedOrders = await db.getAllOrders();
      setOrders(updatedOrders);
      
      setIsSidebarOpen(false);
      setIsFinalized(true);
      setCurrentOrder(orderToSave);
      showToast("Ofício salvo no histórico!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showToast("Erro ao salvar no banco de dados.", "error");
    }
  };

  const handleDeleteOrder = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Ofício",
      message: "Tem certeza que deseja remover este ofício do histórico? Esta ação é definitiva.",
      type: 'danger',
      onConfirm: async () => {
        try {
          await db.deleteOrder(id);
          setOrders(prev => prev.filter(order => order.id !== id));
          showToast("Registro removido com sucesso.");
        } catch (error) {
          showToast("Falha ao excluir registro.", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleClearHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: "Limpar Todo o Histórico",
      message: "Deseja apagar todos os registros de ofícios? O contador global de numeração permanecerá inalterado.",
      type: 'danger',
      onConfirm: async () => {
        try {
          await db.clearAllOrders();
          setOrders([]);
          showToast("Histórico limpo completamente.");
        } catch (error) {
          showToast("Erro ao limpar histórico.", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleOpenAdmin = (tab: string | null = null) => {
    setAppState(globalDefaults);
    setAdminTab(tab);
    setCurrentView('admin');
    setIsSidebarOpen(true);
    setIsFinalized(false);
    setCurrentOrder(null);
  };

  const handleSaveGlobalDefaults = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    setGlobalDefaults(appState);
    showToast("Configurações salvas como padrão global.");
  };

  // Funções de Usuário com Persistência
  const handleAddUser = async (user: User) => {
    try {
      await db.saveUser(user);
      setUsers(prev => [...prev, user]);
      showToast("Usuário adicionado com sucesso.");
    } catch (e) {
      showToast("Erro ao salvar usuário.", "error");
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await db.saveUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser && currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
      showToast("Dados atualizados com sucesso.");
    } catch (e) {
      showToast("Erro ao atualizar usuário.", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await db.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast("Usuário removido.");
    } catch (e) {
      showToast("Erro ao remover usuário.", "error");
    }
  };

  // Funções de Assinatura com Persistência
  const handleAddSignature = async (sig: Signature) => {
    try {
      await db.saveSignature(sig);
      setSignatures(prev => [...prev, sig]);
      showToast("Assinatura adicionada.");
    } catch (e) {
      showToast("Erro ao salvar assinatura.", "error");
    }
  };

  const handleUpdateSignature = async (updatedSig: Signature) => {
    try {
      await db.saveSignature(updatedSig);
      setSignatures(prev => prev.map(s => s.id === updatedSig.id ? updatedSig : s));
      showToast("Assinatura atualizada.");
    } catch (e) {
      showToast("Erro ao atualizar assinatura.", "error");
    }
  };

  const handleDeleteSignature = async (id: string) => {
    try {
      await db.deleteSignature(id);
      setSignatures(prev => prev.filter(s => s.id !== id));
      showToast("Assinatura removida.");
    } catch (e) {
      showToast("Erro ao remover assinatura.", "error");
    }
  };

  const handleDownloadPdf = async (customSnapshot?: AppState) => {
    if (typeof html2pdf === 'undefined') {
      showToast("Carregando ferramenta de PDF...", "info");
      return;
    }

    const originalState = JSON.parse(JSON.stringify(appState));
    const stateToUse = customSnapshot || appState;
    setIsDownloading(true);

    if (customSnapshot) {
        setAppState(customSnapshot);
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    const element = document.getElementById('document-preview-container');
    const scaler = document.getElementById('preview-scaler');

    if (!element || !scaler) {
      setIsDownloading(false);
      return;
    }

    const originalTransform = scaler.style.transform;
    scaler.style.transform = 'scale(1)';
    await new Promise(resolve => setTimeout(resolve, 200));

    const safeTitle = stateToUse.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `oficio-${safeTitle || 'documento'}-${Date.now()}.pdf`;

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] } 
    };

    try {
      await html2pdf().set(opt).from(element).save();
      showToast("Download iniciado!");
    } catch (error) {
      showToast("Erro ao gerar PDF.", "error");
    } finally {
      scaler.style.transform = originalTransform; 
      if (customSnapshot) setAppState(originalState);
      setIsDownloading(false);
    }
  };

  const getHeaderTitle = () => {
    if (isFinalized) return "Visualização Final";
    if (currentView === 'editor') return "Editor de Documento";
    if (currentView === 'tracking') return "Histórico de Ofícios";
    if (currentView === 'admin') {
      switch (adminTab) {
        case 'users': return currentUser?.role === 'admin' ? "Gestão de Usuários" : "Meu Perfil";
        case 'signatures': return "Gestão de Assinaturas";
        case 'ui': return "Interface";
        case 'design': return "Design Doc";
        default: return "Painel Administrativo";
      }
    }
    return "";
  };

  const showFloatingControls = (currentView === 'editor' || isFinalized) && !isDownloading;

  if (!currentUser) return <LoginScreen onLogin={handleLogin} uiConfig={globalDefaults.ui} />;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans overflow-hidden">
      {toast && createPortal(
        <div className="fixed bottom-8 right-8 z-[10000] animate-slide-up">
           <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${
             toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' :
             toast.type === 'error' ? 'bg-red-600 text-white border-red-400' : 'bg-slate-800 text-white border-slate-600'
           }`}>
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              <span className="font-bold text-sm">{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
           </div>
        </div>,
        document.body
      )}

      {confirmModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-md overflow-hidden animate-slide-up border border-white/10">
            <div className="p-8 text-center">
              <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className={`flex-1 px-6 py-4 text-white font-bold rounded-2xl transition-all shadow-lg ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>Confirmar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40 shadow-sm shrink-0">
        <div className="flex items-center gap-4 truncate">
           {(currentView === 'editor' || currentView === 'admin') && !isFinalized && (
             <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 -ml-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-indigo-600 transition-all"><Menu className="w-6 h-6" /></button>
           )}
           {currentView === 'home' && (currentUser.permissions.includes('parent_admin') || currentUser.role === 'admin' || currentUser.role === 'collaborator') && (
             <button onClick={() => handleOpenAdmin(null)} className="p-2.5 -ml-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 shadow-sm transition-all"><LayoutDashboard className="w-5 h-5" /></button>
           )}
           <div className="flex items-center gap-3">
             {globalDefaults.ui.headerLogoUrl && <img src={globalDefaults.ui.headerLogoUrl} alt="Logo" style={{ height: `${globalDefaults.ui.headerLogoHeight}px` }} className="hidden sm:block w-auto object-contain" />}
             <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-lg">{getHeaderTitle()}</span>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {currentView !== 'home' && (
             <button onClick={() => { setCurrentView('home'); setIsSidebarOpen(false); setIsFinalized(false); setCurrentOrder(null); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-700 rounded-xl transition-all font-bold text-sm shadow-sm">
               <LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Início</span>
             </button>
           )}
           <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>
           <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{currentUser.role === 'admin' ? 'Administrador' : 'Colaborador'}</p>
           </div>
           <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl transition-all" title="Sair"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {(currentView === 'editor' || currentView === 'admin') && !isFinalized && (
           <AdminSidebar 
             state={appState} 
             onUpdate={setAppState} 
             onPrint={handleDownloadPdf} 
             onFinish={handleFinishDocument}
             isOpen={isSidebarOpen}
             onClose={() => setIsSidebarOpen(false)}
             isDownloading={isDownloading}
             currentUser={currentUser}
             mode={currentView === 'admin' ? 'admin' : 'editor'}
             onSaveDefault={handleSaveGlobalDefaults}
             activeTab={currentView === 'admin' ? adminTab : 'content'}
             onTabChange={(tab) => setAdminTab(tab)}
             availableSignatures={signatures}
           />
        )}
        
        <div className="flex-1 h-full overflow-hidden relative">
           {currentView === 'home' && (
              <HomeScreen 
                onNewOrder={handleStartNewOrder} 
                onTrackOrder={() => setCurrentView('tracking')}
                onLogout={handleLogout}
                onOpenAdmin={handleOpenAdmin}
                userRole={currentUser.role}
                userName={currentUser.name}
                userJobTitle={currentUser.jobTitle}
                uiConfig={globalDefaults.ui}
                permissions={currentUser.permissions || []}
                stats={{ totalGenerated: oficioCounter, historyCount: orders.length, activeUsers: users.length }}
              />
           )}

           {currentView === 'tracking' && (
              <TrackingScreen 
                onBack={() => setCurrentView('home')} 
                currentUser={currentUser} 
                orders={orders} 
                onDownloadPdf={handleDownloadPdf} 
                onClearAll={handleClearHistory}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
                totalCounter={oficioCounter}
              />
           )}

           {(currentView === 'editor' || currentView === 'admin') && (
              <div className={`w-full h-full overflow-auto bg-slate-200/50 backdrop-blur-sm transition-all duration-300 ${isSidebarOpen ? 'md:pl-[600px] lg:pl-[640px]' : ''}`}>
                {currentView === 'admin' && adminTab === 'users' ? <UserManagementScreen users={users} currentUser={currentUser} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} availableSignatures={signatures} />
                : currentView === 'admin' && adminTab === 'signatures' ? <SignatureManagementScreen signatures={signatures} onAddSignature={handleAddSignature} onUpdateSignature={handleUpdateSignature} onDeleteSignature={handleDeleteSignature} isReadOnly={currentUser.role !== 'admin'} />
                : currentView === 'admin' && adminTab === 'ui' ? <UIPreviewScreen ui={appState.ui} />
                : (
                  <>
                    <DocumentPreview ref={componentRef} state={appState} isGenerating={isDownloading} mode={currentView === 'admin' ? 'admin' : 'editor'} />
                    {showFloatingControls && (
                      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-5 animate-fade-in">
                        <button onClick={() => handleDownloadPdf()} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 group relative">
                          <FileDown className="w-6 h-6" />
                          <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Baixar PDF</span>
                        </button>
                        {!isFinalized && (
                          <button onClick={() => setIsSidebarOpen(true)} className="w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 group relative">
                            <Edit3 className="w-6 h-6" />
                            <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Editar</span>
                          </button>
                        )}
                        {isFinalized && (
                          <button onClick={() => { setCurrentView('home'); setIsFinalized(false); }} className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 group relative">
                            <ArrowLeft className="w-6 h-6" />
                            <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Sair e Finalizar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;
