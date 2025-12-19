
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
import { Menu, FileText, FileDown, Save, Edit3, Check, Loader2, LayoutDashboard, ArrowLeft, PlusCircle } from 'lucide-react';
import * as db from './services/dbService';

declare var html2pdf: any;

const STORAGE_KEY = 'branddoc_settings_v2';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>(MOCK_SIGNATURES);
  
  const [globalDefaults, setGlobalDefaults] = useState<AppState>(INITIAL_STATE);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'tracking' | 'admin'>('home');
  const [adminTab, setAdminTab] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  // Carregar Configurações e Ordens
  useEffect(() => {
    const loadData = async () => {
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

      try {
        const savedOrders = await db.getAllOrders();
        setOrders(savedOrders);
      } catch (e) {
        console.error("Erro ao carregar histórico do IndexedDB:", e);
      }
    };
    
    loadData();
  }, []);

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

    const currentYear = new Date().getFullYear();
    const count = orders.filter(o => o.createdAt.includes(currentYear.toString())).length + 1;
    const protocolNumber = count.toString().padStart(3, '0');
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
      alert("Este registro não possui dados de edição salvos.");
    }
  };

  const handleFinishDocument = async () => {
    if (!currentUser) return;
    
    let orderToSave: Order;

    if (currentOrder) {
      // Atualizar ofício existente
      orderToSave = {
        ...currentOrder,
        title: appState.content.title || 'Documento sem título',
        createdAt: new Date().toISOString(), // Atualiza a data de modificação/finalização
        documentSnapshot: JSON.parse(JSON.stringify(appState))
      };
    } else {
      // Criar novo ofício
      const currentYear = new Date().getFullYear();
      const count = orders.filter(o => o.createdAt.includes(currentYear.toString())).length + 1;
      const protocolNumber = count.toString().padStart(3, '0');
      const protocolStr = `${protocolNumber}/${currentYear}`;

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
      
      // Ocultar sidebar e marcar como finalizado para exibição limpa
      setIsSidebarOpen(false);
      setIsFinalized(true);
      setCurrentOrder(orderToSave);
    } catch (error) {
      console.error("Erro ao salvar ordem:", error);
      alert("Erro ao salvar no banco de dados local. Tente limpar o histórico se o problema persistir.");
    }
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
    try {
      setGlobalDefaults(appState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error("Erro de Quota localStorage:", e);
      alert("Limite de armazenamento do navegador atingido. O sistema tentará otimizar os dados.");
      
      const leanState = JSON.parse(JSON.stringify(appState));
      if (leanState.branding) leanState.branding.logoUrl = null;
      if (leanState.ui) leanState.ui.loginLogoUrl = null;
      if (leanState.ui) leanState.ui.headerLogoUrl = null;
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leanState));
      } catch (innerError) {
        localStorage.clear();
      }
    }
  };

  const handleAddUser = (newUser: User) => setUsers([...users, newUser]);
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) setCurrentUser(updatedUser);
  };
  const handleDeleteUser = (userId: string) => setUsers(users.filter(u => u.id !== userId));

  const handleAddSignature = (sig: Signature) => setSignatures([...signatures, sig]);
  const handleUpdateSignature = (updatedSig: Signature) => setSignatures(signatures.map(s => s.id === updatedSig.id ? updatedSig : s));
  const handleDeleteSignature = (sigId: string) => setSignatures(signatures.filter(s => s.id !== sigId));
  
  const handleSaveDraft = () => {
    if (saveStatus !== 'idle') return;
    setSaveStatus('loading');
    setTimeout(() => {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 1500);
    }, 1000);
  };

  const handleDownloadPdf = async (customSnapshot?: AppState) => {
    if (typeof html2pdf === 'undefined') {
      alert("A ferramenta de geração de PDF está carregando. Tente novamente.");
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
      console.error("Preview container not found in DOM");
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
    } catch (error) {
      console.error("Erro PDF", error);
    } finally {
      scaler.style.transform = originalTransform; 
      if (customSnapshot) {
        setAppState(originalState);
      }
      setIsDownloading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Tem certeza que deseja apagar TODO o histórico? Esta ação não pode ser desfeita.")) {
      await db.clearAllOrders();
      setOrders([]);
    }
  };

  const getHeaderTitle = () => {
    if (isFinalized) return "Visualização Final";
    if (currentView === 'editor') return "Editor de Documento";
    if (currentView === 'tracking') return "Central de Pedidos";
    if (currentView === 'admin') {
      switch (adminTab) {
        case 'users': return "Gestão de Usuários";
        case 'signatures': return "Gestão de Assinaturas";
        case 'ui': return "Personalização de Interface";
        case 'design': return "Identidade do Documento";
        default: return "Painel Administrativo";
      }
    }
    return "Início";
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} uiConfig={globalDefaults.ui} />;

  const isAdminMode = currentView === 'admin';
  const isBlockingTab = isAdminMode && (adminTab === 'users' || adminTab === 'ui' || adminTab === 'signatures');
  const showFloatingControls = !isSidebarOpen && !isBlockingTab && currentView === 'editor';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans overflow-hidden">
      {isDownloading && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center border border-slate-200">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Gerando PDF</h3>
              <p className="text-sm text-slate-500 mt-1">Isso pode levar alguns segundos. Por favor, aguarde.</p>
            </div>
          </div>
        </div>
      )}

      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40 shadow-sm shrink-0">
        <div className="flex items-center gap-4 truncate">
           <button 
             onClick={() => !isFinalized && setIsSidebarOpen(true)}
             disabled={isFinalized}
             className={`p-2.5 -ml-2 rounded-xl transition-all shrink-0 ${isFinalized ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700 hover:text-indigo-600'}`}
           >
             <Menu className="w-6 h-6" />
           </button>
           <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block shrink-0"></div>
           <div className="flex items-center gap-3 truncate">
             <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 shrink-0">
                <FileText className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-lg transition-all duration-300 truncate">
                {getHeaderTitle()}
             </span>
           </div>
        </div>
        <button 
          onClick={() => {
            setCurrentView('home');
            setIsSidebarOpen(false);
            setIsFinalized(false);
            setCurrentOrder(null);
          }}
          className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-lg rounded-xl transition-all duration-300 font-bold text-sm shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center transition-all group-hover:rotate-12">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {(currentView === 'editor' || currentView === 'admin') && !isFinalized && (
           <AdminSidebar 
             state={appState} 
             onUpdate={setAppState} 
             onPrint={handleDownloadPdf} 
             onFinish={handleFinishDocument}
             isOpen={isSidebarOpen}
             onClose={() => {
                setIsSidebarOpen(false);
                if (isAdminMode) setCurrentView('home');
             }}
             isDownloading={isDownloading}
             currentUser={currentUser}
             mode={isAdminMode ? 'admin' : 'editor'}
             onSaveDefault={handleSaveGlobalDefaults}
             activeTab={isAdminMode ? adminTab : 'content'}
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
              />
           )}

           {(currentView === 'editor' || currentView === 'admin' || isDownloading) && (
              <div 
                className={`w-full h-full overflow-auto bg-slate-200/50 backdrop-blur-sm transition-all duration-300 ${
                   isSidebarOpen ? 'md:pl-[600px] lg:pl-[640px]' : ''
                } ${isDownloading && currentView === 'tracking' ? 'invisible pointer-events-none fixed top-0 left-0 z-[-1]' : ''}`}
              >
                {isAdminMode && adminTab === 'users' ? (
                   <UserManagementScreen 
                     users={users}
                     onAddUser={handleAddUser}
                     onUpdateUser={handleUpdateUser}
                     onDeleteUser={handleDeleteUser}
                     availableSignatures={signatures}
                   />
                ) : isAdminMode && adminTab === 'signatures' ? (
                   <SignatureManagementScreen
                      signatures={signatures}
                      onAddSignature={handleAddSignature}
                      onUpdateSignature={handleUpdateSignature}
                      onDeleteSignature={handleDeleteSignature}
                   />
                ) : isAdminMode && adminTab === 'ui' ? (
                   <UIPreviewScreen ui={appState.ui} />
                ) : (
                  <>
                    <DocumentPreview 
                      ref={componentRef} 
                      state={appState} 
                      isGenerating={isDownloading}
                      mode={isAdminMode ? 'admin' : 'editor'}
                    />
                    
                    {showFloatingControls && (
                      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-5 print:hidden animate-fade-in">
                        <button
                          onClick={() => handleDownloadPdf()}
                          disabled={isDownloading}
                          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg transition-all flex items-center justify-center group relative"
                          title="Exportar PDF"
                        >
                           <FileDown className="w-6 h-6" />
                           <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Baixar PDF</span>
                        </button>
                        
                        {!isFinalized && (
                          <>
                            <button
                              onClick={handleSaveDraft}
                              disabled={saveStatus === 'loading' || saveStatus === 'success'}
                              className={`w-14 h-14 rounded-2xl shadow-lg transition-all flex items-center justify-center bg-white group relative ${
                                saveStatus === 'success' ? 'text-emerald-500' : 'text-slate-600 hover:text-emerald-600'
                              }`}
                              title="Salvar Rascunho"
                            >
                              {saveStatus === 'success' ? <Check className="w-6 h-6" /> : <Save className="w-6 h-6" />}
                              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Salvar Rascunho</span>
                            </button>

                            <button
                              onClick={() => setIsSidebarOpen(true)}
                              className="w-14 h-14 bg-white text-slate-600 hover:text-indigo-600 rounded-2xl shadow-lg flex items-center justify-center group relative"
                              title="Abrir Editor"
                            >
                              <Edit3 className="w-6 h-6" />
                              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Editar Campos</span>
                            </button>
                          </>
                        )}

                        {isFinalized && (
                          <>
                            <button
                              onClick={() => {
                                setIsFinalized(false);
                                setIsSidebarOpen(true);
                              }}
                              className="w-14 h-14 bg-white text-amber-600 hover:bg-amber-50 rounded-2xl shadow-lg flex items-center justify-center group relative"
                              title="Reabrir Edição"
                            >
                              <Edit3 className="w-6 h-6" />
                              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Continuar Editando</span>
                            </button>
                            
                            <button
                              onClick={handleStartNewOrder}
                              className="w-14 h-14 bg-white text-emerald-600 hover:bg-emerald-50 rounded-2xl shadow-lg flex items-center justify-center group relative"
                              title="Novo Ofício"
                            >
                              <PlusCircle className="w-6 h-6" />
                              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Criar Outro</span>
                            </button>

                            <button
                              onClick={() => {
                                setCurrentView('home');
                                setIsFinalized(false);
                                setCurrentOrder(null);
                              }}
                              className="w-14 h-14 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center group relative"
                              title="Voltar ao Início"
                            >
                              <ArrowLeft className="w-6 h-6" />
                              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Finalizar e Sair</span>
                            </button>
                          </>
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
