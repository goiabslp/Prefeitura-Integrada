
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
import { AppState, User, Order, Signature, BlockType } from './types';
import { Menu, FileText, FileDown, Edit3, Check, Loader2, LayoutDashboard, ArrowLeft, LogOut, AlertTriangle, X, Info } from 'lucide-react';
import * as db from './services/dbService';
import { createPortal } from 'react-dom';

declare var html2pdf: any;

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
  const [activeBlock, setActiveBlock] = useState<BlockType | null>(null);
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const dbSettings = await db.getGlobalSettings();
        if (dbSettings) {
          setGlobalDefaults(dbSettings);
          setAppState(dbSettings);
        } else {
          await db.saveGlobalSettings(INITIAL_STATE);
          setGlobalDefaults(INITIAL_STATE);
          setAppState(INITIAL_STATE);
        }

        const savedCounter = localStorage.getItem(COUNTER_KEY);
        if (savedCounter) {
          setOficioCounter(parseInt(savedCounter, 10));
        }

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
        console.error("Erro crítico ao carregar dados persistentes:", e);
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
    setActiveBlock(null);
    setAppState(globalDefaults);
    setIsFinalized(false);
    setCurrentOrder(null);
  };

  const handleStartNewOrder = () => {
    if (!activeBlock) return;

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
    const blockPrefix = activeBlock.toUpperCase();
    const protocolStr = `${blockPrefix}-${protocolNumber}/${currentYear}`;

    setAppState({
      ...globalDefaults,
      content: {
        ...globalDefaults.content,
        signatureName: initialSigName,
        signatureRole: initialSigRole,
        signatureSector: initialSigSector,
        title: '', 
        body: globalDefaults.content.body,
        leftBlockText: `Protocolo nº ${protocolStr}\nAssunto: `,
        subType: undefined,
        diariaFields: undefined
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
      setActiveBlock(order.blockType);
      setIsFinalized(false);
      setIsSidebarOpen(true);
      setAdminTab('content');
      setCurrentView('editor');
      setCurrentOrder(order);
    }
  };

  const handleFinishDocument = async () => {
    if (!currentUser || !activeBlock) return;

    if (activeBlock === 'diarias' && !appState.content.subType) {
        showToast("Escolha entre Diária ou Custeio.", "error");
        return;
    }
    
    let orderToSave: Order;
    const protocolMatch = appState.content.leftBlockText.match(/nº ([A-Z0-9-/]+)/);
    const protocolStr = protocolMatch ? protocolMatch[1] : `${oficioCounter.toString().padStart(3, '0')}/${new Date().getFullYear()}`;

    orderToSave = {
      id: currentOrder?.id || Date.now().toString(),
      protocol: protocolStr,
      title: appState.content.title || 'Documento sem título',
      status: 'completed',
      createdAt: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      blockType: activeBlock,
      documentSnapshot: JSON.parse(JSON.stringify(appState))
    };

    try {
      await db.saveOrder(orderToSave);
      const updatedOrders = await db.getAllOrders();
      setOrders(updatedOrders);
      setIsSidebarOpen(false);
      setIsFinalized(true);
      setCurrentOrder(orderToSave);
      showToast("Documento salvo com sucesso!");
    } catch (error) {
      showToast("Erro ao salvar no banco de dados.", "error");
    }
  };

  const handleDeleteOrder = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Registro",
      message: "Tem certeza que deseja remover este registro do histórico?",
      type: 'danger',
      onConfirm: async () => {
        try {
          await db.deleteOrder(id);
          setOrders(prev => prev.filter(order => order.id !== id));
          showToast("Registro removido.");
        } catch (error) {
          showToast("Falha ao excluir.", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleClearHistory = () => {
    if (!activeBlock) return;
    setConfirmModal({
      isOpen: true,
      title: `Limpar Histórico de ${activeBlock.toUpperCase()}`,
      message: "Deseja apagar todos os registros deste bloco?",
      type: 'danger',
      onConfirm: async () => {
        try {
          const otherOrders = orders.filter(o => o.blockType !== activeBlock);
          await db.clearAllOrders();
          for(const o of otherOrders) { await db.saveOrder(o); }
          setOrders(otherOrders);
          showToast("Histórico limpo.");
        } catch (error) {
          showToast("Erro ao limpar histórico.", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleOpenAdmin = (tab?: string | null) => {
    setCurrentView('admin');
    setAdminTab(tab || 'users');
    setIsSidebarOpen(false);
  };

  const handleAddUser = async (user: User) => {
    try {
      await db.saveUser(user);
      const updatedUsers = await db.getAllUsers();
      setUsers(updatedUsers);
      showToast("Usuário adicionado!");
    } catch (e) { showToast("Erro ao adicionar.", "error"); }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      await db.saveUser(user);
      const updatedUsers = await db.getAllUsers();
      setUsers(updatedUsers);
      showToast("Dados atualizados!");
    } catch (e) { showToast("Erro ao atualizar.", "error"); }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await db.deleteUser(userId);
      const updatedUsers = await db.getAllUsers();
      setUsers(updatedUsers);
      showToast("Usuário removido.");
    } catch (e) { showToast("Erro ao remover.", "error"); }
  };

  const handleAddSignature = async (sig: Signature) => {
    try {
      await db.saveSignature(sig);
      const updatedSigs = await db.getAllSignatures();
      setSignatures(updatedSigs);
      showToast("Assinatura adicionada!");
    } catch (e) { showToast("Erro ao adicionar.", "error"); }
  };

  const handleUpdateSignature = async (sig: Signature) => {
    try {
      await db.saveSignature(sig);
      const updatedSigs = await db.getAllSignatures();
      setSignatures(updatedSigs);
      showToast("Assinatura atualizada!");
    } catch (e) { showToast("Erro ao atualizar.", "error"); }
  };

  const handleDeleteSignature = async (id: string) => {
    try {
      await db.deleteSignature(id);
      const updatedSigs = await db.getAllSignatures();
      setSignatures(updatedSigs);
      showToast("Assinatura removida.");
    } catch (e) { showToast("Erro ao remover.", "error"); }
  };

  const handleDownloadPdf = async (customSnapshot?: AppState) => {
    if (typeof html2pdf === 'undefined') return;
    
    setIsDownloading(true);
    const originalState = JSON.parse(JSON.stringify(appState));
    if (customSnapshot) setAppState(customSnapshot);

    await new Promise(resolve => setTimeout(resolve, 600));
    const element = document.getElementById('document-preview-container');
    const scaler = document.getElementById('preview-scaler');
    if (!element || !scaler) { setIsDownloading(false); return; }

    const originalTransform = scaler.style.transform;
    scaler.style.transform = 'scale(1)';
    
    const opt = {
      margin: 0,
      filename: `doc-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
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
    if (currentView === 'editor') return `Editor: ${activeBlock?.toUpperCase() || ''}`;
    if (currentView === 'tracking') return `Histórico: ${activeBlock?.toUpperCase() || ''}`;
    if (currentView === 'admin') return "Painel Administrativo";
    return "Menu Principal";
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} uiConfig={globalDefaults.ui} />;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans">
      {toast && createPortal(
        <div className="fixed bottom-8 right-8 z-[10000] animate-slide-up">
           <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              <Info className="w-5 h-5" />
              <span className="font-bold text-sm">{toast.message}</span>
           </div>
        </div>, document.body
      )}

      {confirmModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden p-8 text-center">
            <h3 className="text-xl font-black text-slate-900 mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl">Excluir</button>
            </div>
          </div>
        </div>, document.body
      )}

      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 shadow-sm">
        <div className="flex items-center gap-4 truncate">
           <div className="flex items-center gap-3">
             {globalDefaults.ui.headerLogoUrl && <img src={globalDefaults.ui.headerLogoUrl} alt="Logo" style={{ height: '32px' }} />}
             <span className="font-black text-slate-900 tracking-tight">{getHeaderTitle()}</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
           {currentView !== 'home' && (
             <button onClick={() => { setCurrentView('home'); setActiveBlock(null); setIsSidebarOpen(false); setIsFinalized(false); }} className="px-4 py-2 bg-slate-50 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-100 transition-all">Início</button>
           )}
           <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
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
             activeTab={currentView === 'admin' ? adminTab : 'content'}
             onTabChange={setAdminTab}
             availableSignatures={signatures}
             activeBlock={activeBlock}
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
                permissions={currentUser.permissions || []}
                activeBlock={activeBlock}
                setActiveBlock={setActiveBlock}
                stats={{ totalGenerated: oficioCounter, historyCount: orders.length, activeUsers: users.length }}
              />
           )}

           {currentView === 'tracking' && (
              <TrackingScreen 
                onBack={() => setCurrentView('home')} 
                currentUser={currentUser} 
                activeBlock={activeBlock}
                orders={orders} 
                onDownloadPdf={handleDownloadPdf} 
                onClearAll={handleClearHistory}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
                totalCounter={oficioCounter}
              />
           )}

           {(currentView === 'editor' || currentView === 'admin') && (
              <div className={`w-full h-full overflow-auto bg-slate-100 transition-all duration-300 ${isSidebarOpen ? 'pl-[600px] lg:pl-[640px]' : ''}`}>
                {currentView === 'admin' && adminTab === 'users' ? <UserManagementScreen users={users} currentUser={currentUser} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} availableSignatures={signatures} />
                : currentView === 'admin' && adminTab === 'signatures' ? <SignatureManagementScreen signatures={signatures} onAddSignature={handleAddSignature} onUpdateSignature={handleUpdateSignature} onDeleteSignature={handleDeleteSignature} currentUser={currentUser} />
                : currentView === 'admin' && adminTab === 'ui' ? <UIPreviewScreen ui={appState.ui} />
                : (
                  <div className="p-10">
                    <DocumentPreview ref={componentRef} state={appState} isGenerating={isDownloading} activeBlock={activeBlock} />
                    {!isDownloading && (
                      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4">
                        <button onClick={() => handleDownloadPdf()} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 transition-transform"><FileDown /></button>
                        {!isFinalized && <button onClick={() => setIsSidebarOpen(true)} className="w-14 h-14 bg-white text-slate-900 rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 transition-transform"><Edit3 /></button>}
                      </div>
                    )}
                  </div>
                )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;
