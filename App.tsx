
import React, { useState, useRef } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { DocumentPreview } from './components/DocumentPreview';
import { HomeScreen } from './components/HomeScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementScreen } from './components/UserManagementScreen';
import { SignatureManagementScreen } from './components/SignatureManagementScreen';
import { INITIAL_STATE, DEFAULT_USERS, MOCK_ORDERS, MOCK_SIGNATURES } from './constants';
import { AppState, FontFamily, User, Order, Signature } from './types';
import { Menu, FileText, ArrowLeft, Home, LogOut, FileDown, Save, Edit3, Check, Loader2, LayoutDashboard } from 'lucide-react';

// Declaração para a biblioteca html2pdf carregada via CDN
declare var html2pdf: any;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [signatures, setSignatures] = useState<Signature[]>(MOCK_SIGNATURES);
  const [globalDefaults, setGlobalDefaults] = useState<AppState>(INITIAL_STATE);
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'tracking' | 'admin'>('home');
  const [adminTab, setAdminTab] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const componentRef = useRef<HTMLDivElement>(null);

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

    setAppState({
      ...globalDefaults,
      content: {
        ...globalDefaults.content,
        signatureName: initialSigName,
        signatureRole: initialSigRole,
        signatureSector: initialSigSector,
        title: '',
        body: globalDefaults.content.body
      },
      document: {
        ...globalDefaults.document,
        showSignature: false
      }
    });
    setAdminTab('content');
    setCurrentView('editor');
    setIsSidebarOpen(true);
  };

  const handleOpenAdmin = (tab: string | null = null) => {
    setAppState(globalDefaults);
    setAdminTab(tab);
    setCurrentView('admin');
    setIsSidebarOpen(true);
  };

  const handleSaveGlobalDefaults = () => {
    setGlobalDefaults(appState);
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

  const handleDownloadPdf = async () => {
    if (typeof html2pdf === 'undefined') {
      alert("A ferramenta de geração de PDF está carregando. Tente novamente.");
      return;
    }

    const element = document.getElementById('document-preview-container');
    const scaler = document.getElementById('preview-scaler');

    if (!element || !scaler) return;

    setIsDownloading(true);
    const originalTransform = scaler.style.transform;
    await new Promise(resolve => setTimeout(resolve, 500)); 
    scaler.style.transform = 'scale(1)';

    const opt = {
      margin: 0,
      filename: `documento-${Date.now()}.pdf`,
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
      setIsDownloading(false);
    }
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} uiConfig={globalDefaults.ui} />;

  if (currentView === 'home') {
    return (
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
    );
  }

  if (currentView === 'tracking') {
    return <TrackingScreen onBack={() => setCurrentView('home')} currentUser={currentUser} orders={orders} />;
  }

  const isAdminMode = currentView === 'admin';
  const isBlockingTab = isAdminMode && (adminTab === 'users' || adminTab === 'ui' || adminTab === 'signatures');
  const showFloatingControls = !isSidebarOpen && !isBlockingTab;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans overflow-hidden">
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="p-2.5 -ml-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all hover:text-indigo-600"
           >
             <Menu className="w-6 h-6" />
           </button>
           <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
           <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                <FileText className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-slate-900 tracking-tight hidden md:block text-lg">BrandDoc Pro</span>
             {isAdminMode && (
                <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest border border-orange-200">
                  Admin Panel
                </span>
             )}
           </div>
        </div>
        <button 
          onClick={() => setCurrentView('home')}
          className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-lg rounded-xl transition-all duration-300 font-bold text-sm"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center transition-all group-hover:rotate-12">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span>Dashboard</span>
        </button>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        <AdminSidebar 
          state={appState} 
          onUpdate={setAppState} 
          onPrint={handleDownloadPdf} 
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
        
        <div 
          className={`flex-1 h-full overflow-auto relative bg-slate-200/50 backdrop-blur-sm transition-all duration-300 ${
            showFloatingControls ? 'pl-0 md:pl-28' : ''
          } ${isSidebarOpen ? 'md:pl-[600px] lg:pl-[640px]' : ''}`}
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
          ) : (
            <>
              <DocumentPreview 
                ref={componentRef} 
                state={appState} 
                isGenerating={isDownloading}
                mode={isAdminMode ? 'admin' : 'editor'}
              />
              
              {showFloatingControls && (
                <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-5 print:hidden">
                  <div className="group relative flex items-center justify-start">
                     <button
                       onClick={handleDownloadPdf}
                       disabled={isDownloading}
                       className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border border-indigo-400/20 z-20"
                     >
                       {isDownloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileDown className="w-6 h-6" />}
                     </button>
                     <div className="absolute left-14 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none translate-x-[-10px] group-hover:translate-x-0">
                        Exportar PDF
                     </div>
                  </div>
                  
                  <div className="group relative flex items-center justify-start">
                     <button
                       onClick={handleSaveDraft}
                       disabled={saveStatus === 'loading' || saveStatus === 'success'}
                       className={`w-14 h-14 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center border hover:scale-110 active:scale-95 z-20 ${
                          saveStatus === 'success'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/30'
                            : 'bg-white text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-500/20'
                       }`}
                     >
                       {saveStatus === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : saveStatus === 'success' ? <Check className="w-6 h-6 animate-bounce" /> : <Save className="w-6 h-6" />}
                     </button>
                     <div className="absolute left-14 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none translate-x-[-10px] group-hover:translate-x-0">
                        {saveStatus === 'success' ? 'Salvo!' : 'Salvar Rascunho'}
                     </div>
                  </div>

                  <div className="group relative flex items-center justify-start">
                     <button
                       onClick={() => setIsSidebarOpen(true)}
                       className="w-14 h-14 bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-2xl shadow-lg hover:shadow-indigo-500/10 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-20"
                     >
                       <Edit3 className="w-6 h-6" />
                     </button>
                     <div className="absolute left-14 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none translate-x-[-10px] group-hover:translate-x-0">
                        Painel Lateral
                     </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
