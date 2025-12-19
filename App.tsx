
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
const COUNTER_KEY = 'branddoc_oficio_counter_global';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>(MOCK_SIGNATURES);
  
  const [globalDefaults, setGlobalDefaults] = useState<AppState>(INITIAL_STATE);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [oficioCounter, setOficioCounter] = useState<number>(0);
  
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'tracking' | 'admin'>('home');
  const [adminTab, setAdminTab] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  // Carregar Configurações, Ordens e Contador
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

      // Carregar Contador Global do LocalStorage
      const savedCounter = localStorage.getItem(COUNTER_KEY);
      if (savedCounter) {
        setOficioCounter(parseInt(savedCounter, 10));
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

    // Incremento do Contador Sequencial Global Persistente
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
        createdAt: new Date().toISOString(),
        documentSnapshot: JSON.parse(JSON.stringify(appState))
      };
    } else {
      // Extrair protocolo do texto do bloco esquerdo
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
    } catch (error) {
      console.error("Erro ao salvar ordem:", error);
      alert("Erro ao salvar no banco de dados local.");
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
      console.error("Erro localStorage:", e);
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
      alert("Carregando ferramenta de PDF...");
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
    } catch (error) {
      console.error("Erro PDF", error);
    } finally {
      scaler.style.transform = originalTransform; 
      if (customSnapshot) setAppState(originalState);
      setIsDownloading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Deseja realmente apagar o histórico visível?")) {
      await db.clearAllOrders();
      setOrders([]);
    }
  };

  const getHeaderTitle = () => {
    if (isFinalized) return "Visualização Final";
    if (currentView === 'editor') return "Editor de Documento";
    if (currentView === 'tracking') return "Histórico de Ofícios";
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
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <h3 className="text-lg font-bold text-slate-900">Gerando PDF</h3>
          </div>
        </div>
      )}

      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40 shadow-sm shrink-0">
        <div className="flex items-center gap-4 truncate">
           <button 
             onClick={() => !isFinalized && setIsSidebarOpen(true)}
             disabled={isFinalized}
             className={`p-2.5 -ml-2 rounded-xl transition-all ${isFinalized ? 'text-slate-300' : 'hover:bg-slate-100 text-slate-700 hover:text-indigo-600'}`}
           >
             <Menu className="w-6 h-6" />
           </button>
           <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
           <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                <FileText className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-lg truncate">
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
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-700 rounded-xl transition-all font-bold text-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
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
                stats={{
                  totalGenerated: oficioCounter,
                  historyCount: orders.length,
                  activeUsers: users.length
                }}
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
                totalCounter={oficioCounter}
              />
           )}

           {(currentView === 'editor' || currentView === 'admin' || isDownloading) && (
              <div className={`w-full h-full overflow-auto bg-slate-200/50 backdrop-blur-sm transition-all duration-300 ${isSidebarOpen ? 'md:pl-[600px] lg:pl-[640px]' : ''}`}>
                {isAdminMode && adminTab === 'users' ? (
                   <UserManagementScreen users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} availableSignatures={signatures} />
                ) : isAdminMode && adminTab === 'signatures' ? (
                   <SignatureManagementScreen signatures={signatures} onAddSignature={handleAddSignature} onUpdateSignature={handleUpdateSignature} onDeleteSignature={handleDeleteSignature} />
                ) : isAdminMode && adminTab === 'ui' ? (
                   <UIPreviewScreen ui={appState.ui} />
                ) : (
                  <>
                    <DocumentPreview ref={componentRef} state={appState} isGenerating={isDownloading} mode={isAdminMode ? 'admin' : 'editor'} />
                    {showFloatingControls && (
                      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-5 animate-fade-in">
                        <button 
                          onClick={() => handleDownloadPdf()} 
                          className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 group relative"
                          title="Baixar PDF"
                        >
                          <FileDown className="w-6 h-6" />
                          <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Baixar PDF</span>
                        </button>
                        
                        {!isFinalized && (
                          <button 
                            onClick={() => setIsSidebarOpen(true)} 
                            className="w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 group relative"
                            title="Editar"
                          >
                            <Edit3 className="w-6 h-6" />
                            <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Editar</span>
                          </button>
                        )}
                        
                        {isFinalized && (
                          <>
                            <button 
                              onClick={() => {
                                setIsFinalized(false);
                                setIsSidebarOpen(true);
                              }} 
                              className="w-14 h-14 bg-white text-amber-600 rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 group relative border border-amber-100"
                              title="Editar Documento"
                            >
                              <Edit3 className="w-6 h-6" />
                              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Editar Documento</span>
                            </button>
                            <button 
                              onClick={() => {
                                setCurrentView('home'); 
                                setIsFinalized(false);
                              }} 
                              className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 group relative"
                              title="Voltar ao Início"
                            >
                              <ArrowLeft className="w-6 h-6" />
                              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Sair e Finalizar</span>
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
