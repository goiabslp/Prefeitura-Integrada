import React, { useState, useRef } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { DocumentPreview } from './components/DocumentPreview';
import { HomeScreen } from './components/HomeScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementScreen } from './components/UserManagementScreen';
import { SignatureManagementScreen } from './components/SignatureManagementScreen'; // Nova Importação
import { INITIAL_STATE, DEFAULT_USERS, MOCK_ORDERS, MOCK_SIGNATURES } from './constants';
import { AppState, FontFamily, User, Order, Signature } from './types';
import { Menu, FileText, ArrowLeft, Home, LogOut, FileDown, Save, Edit3, Check, Loader2 } from 'lucide-react';

// Declaração para a biblioteca html2pdf carregada via CDN
declare var html2pdf: any;

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  
  // Data State
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [signatures, setSignatures] = useState<Signature[]>(MOCK_SIGNATURES); // Novo Estado

  // Global Defaults State (Simulando Banco de Dados de Configuração)
  const [globalDefaults, setGlobalDefaults] = useState<AppState>(INITIAL_STATE);

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'tracking' | 'admin'>('home');
  // Alterado para string | null para suportar o menu principal (null)
  const [adminTab, setAdminTab] = useState<string | null>(null);
  
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle'); // Estado visual para o botão salvar
  const componentRef = useRef<HTMLDivElement>(null);

  const handleLogin = (username: string, pass: string): boolean => {
    // Case insensitive username check
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
    setAppState(globalDefaults); // Reseta para o padrão global ao sair
  };

  const handleStartNewOrder = () => {
    // Ao iniciar um novo pedido, FORÇA o uso do padrão global
    // Se o usuário tiver assinaturas permitidas, tenta pré-selecionar a primeira
    // Senão, usa os dados do usuário como fallback
    
    let initialSigName = currentUser?.name || '';
    let initialSigRole = currentUser?.jobTitle || (currentUser?.role === 'admin' ? 'Administrador' : 'Colaborador');
    let initialSigSector = currentUser?.sector || '';

    // Lógica de pré-seleção inteligente de assinatura
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
        title: '', // Limpa título para novo pedido
        body: globalDefaults.content.body // Mantém placeholder ou corpo padrão
      },
      document: {
        ...globalDefaults.document,
        showSignature: false // Desativa por padrão para novo pedido
      }
    });
    setAdminTab('content'); // Força aba de conteúdo para o Editor
    setCurrentView('editor');
    setIsSidebarOpen(true);
  };

  const handleOpenAdmin = () => {
    // Ao abrir o admin, carrega o estado global atual para edição
    // E muda a view para 'admin' para exibir o preview em tempo real
    setAppState(globalDefaults);
    setAdminTab(null); // Define como null para mostrar o MENU de módulos
    setCurrentView('admin');
    setIsSidebarOpen(true);
  };

  const handleSaveGlobalDefaults = () => {
    // Salva o estado atual do editor como o novo padrão global
    setGlobalDefaults(appState);
  };

  const handleAddUser = (newUser: User) => {
    setUsers([...users, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    // Atualiza a lista de usuários
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    
    // Se o usuário atualizado for o usuário logado, atualiza o estado da sessão também
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  // --- Handlers de Assinaturas ---
  const handleAddSignature = (sig: Signature) => {
    setSignatures([...signatures, sig]);
  };

  const handleUpdateSignature = (updatedSig: Signature) => {
    setSignatures(signatures.map(s => s.id === updatedSig.id ? updatedSig : s));
  };

  const handleDeleteSignature = (sigId: string) => {
    setSignatures(signatures.filter(s => s.id !== sigId));
    // Opcional: Remover referência dos usuários também, mas não estritamente necessário para o MVP
  };
  
  // Simulação de Salvamento de Rascunho com Feedback Visual
  const handleSaveDraft = () => {
    if (saveStatus !== 'idle') return;

    setSaveStatus('loading');
    
    // Simula delay de rede e depois confirmação
    setTimeout(() => {
        // Aqui entraria a lógica real de persistência
        setSaveStatus('success');
        
        setTimeout(() => {
            setSaveStatus('idle');
        }, 1500); // Exibe o sucesso por 1.5s antes de voltar ao normal
    }, 1000);
  };

  const handleDownloadPdf = async () => {
    if (typeof html2pdf === 'undefined') {
      alert("A ferramenta de geração de PDF está carregando. Tente novamente.");
      return;
    }

    // Selecionamos o conteúdo interno (que tem tamanho real) e o wrapper de escala
    const element = document.getElementById('document-preview-container');
    const scaler = document.getElementById('preview-scaler');

    if (!element || !scaler) return;

    setIsDownloading(true);

    // Salva o transform original para restaurar depois
    const originalTransform = scaler.style.transform;
    
    // FORÇA O SCALE PARA 1 (100%) temporariamente.
    // O DocumentPreview vai reagir ao isDownloading removendo margens, sombras e ring
    
    // Aumentado o delay para garantir que o React re-renderize o layout "limpo" (sem margens)
    // antes do html2pdf capturar o DOM.
    await new Promise(resolve => setTimeout(resolve, 500)); 

    scaler.style.transform = 'scale(1)';

    const opt = {
      margin: 0, // MARGEM ZERO é crucial. As margens internas já estão no padding do DocumentPreview.
      filename: 'documento-oficial.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      // mode: 'css' respeita o 'break-after: always' e 'avoid' do CSS
      pagebreak: { mode: ['css', 'legacy'] } 
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Erro PDF", error);
      alert("Erro ao gerar PDF.");
    } finally {
      // Restaura o zoom original da tela
      scaler.style.transform = originalTransform; 
      setIsDownloading(false);
    }
  };

  // Auth Guard
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} uiConfig={globalDefaults.ui} />;
  }

  // View Routing
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
        uiConfig={globalDefaults.ui} // Passa configuração global de UI
      />
    );
  }

  if (currentView === 'tracking') {
    return (
      <TrackingScreen 
        onBack={() => setCurrentView('home')} 
        currentUser={currentUser}
        orders={orders}
      />
    );
  }

  // Editor View OR Admin View (Shared Layout)
  if (currentUser.role === 'licitacao' && currentView === 'editor') {
    setCurrentView('home');
    return null;
  }

  const isEditorMode = currentView === 'editor';
  const isAdminMode = currentView === 'admin';

  // Verifica se devemos mostrar os controles flutuantes
  // Apenas se a sidebar estiver FECHADA e não estivermos em abas administrativas puras
  // Agora adminTab pode ser null, então ajustamos a lógica: se adminTab for null (menu), não esconde.
  // Se adminTab for 'users', 'ui' ou 'signatures', esconde.
  const isBlockingTab = isAdminMode && (adminTab === 'users' || adminTab === 'ui' || adminTab === 'signatures');
  const showFloatingControls = !isSidebarOpen && !isBlockingTab;

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100 font-sans overflow-hidden">
      <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-slate-700 transition-colors"
           >
             <Menu className="w-6 h-6" />
           </button>
           <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
           <div className="flex items-center gap-2">
             <div className="p-1.5 bg-indigo-600 rounded shadow-md shadow-indigo-500/20">
                <FileText className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-slate-900 tracking-tight hidden sm:block">BrandDoc Pro</span>
             {isAdminMode && (
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 uppercase tracking-wide">
                  Modo Admin
                </span>
             )}
           </div>
        </div>
        <button 
          onClick={() => setCurrentView('home')}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md rounded-xl transition-all duration-300 font-bold text-sm"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Voltar para Home</span>
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
             if (isAdminMode) {
                setCurrentView('home');
             }
          }}
          isDownloading={isDownloading}
          currentUser={currentUser}
          mode={isAdminMode ? 'admin' : 'editor'}
          onSaveDefault={handleSaveGlobalDefaults}
          // Tab Control
          activeTab={isAdminMode ? adminTab : 'content'}
          onTabChange={(tab) => setAdminTab(tab)}
          // Assinaturas
          availableSignatures={signatures}
        />
        
        <div 
          id="print-area"
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
          ) : isAdminMode && adminTab === 'ui' ? (
             <div className="h-full flex flex-col justify-center items-center p-8">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-4xl w-full border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Home className="w-6 h-6" />
                      </span>
                      Pré-visualização da Tela Inicial
                    </h2>
                    
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 relative overflow-hidden">
                       <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 flex items-center relative h-24">
                          <div className={`flex items-center absolute transition-all duration-300 ${
                             appState.ui.homeLogoPosition === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-4'
                          }`}>
                            {appState.ui.homeLogoUrl ? (
                              <img 
                                src={appState.ui.homeLogoUrl} 
                                alt="Logo App" 
                                style={{ height: `${appState.ui.homeLogoHeight}px` }}
                                className="object-contain transition-all duration-300" 
                              />
                            ) : (
                              <span className="text-slate-400 font-bold">Sem Logo</span>
                            )}
                          </div>
                          
                          <div className="absolute right-4 flex gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                             <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                          </div>
                          <div className="absolute left-4 w-8 h-8 rounded-lg bg-slate-200 opacity-50" style={{ display: appState.ui.homeLogoPosition === 'center' ? 'block' : 'none' }}></div>
                       </div>
                       <p className="text-center text-slate-400 text-sm mt-4">Esta é uma simulação da barra de navegação.</p>
                    </div>
                </div>
             </div>
          ) : (
            <>
              <DocumentPreview 
                ref={componentRef} 
                state={appState} 
                isGenerating={isDownloading} // PASSANDO A PROP DE CONTROLE
                mode={isAdminMode ? 'admin' : 'editor'}
              />
              
              {/* === BOTÕES FLUTUANTES MODERNOS (Lateral ESQUERDA - Oposta à Rolagem) === */}
              {showFloatingControls && (
                <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-5 print:hidden">
                  
                  {/* Botão Gerar PDF */}
                  <div className="group relative flex items-center justify-start">
                     <button
                       onClick={handleDownloadPdf}
                       disabled={isDownloading}
                       className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border border-indigo-400/20 z-20"
                       title="Gerar PDF"
                     >
                       {isDownloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileDown className="w-6 h-6" />}
                     </button>
                     {/* Label lateral direita (já que o botão está na esquerda) */}
                     <div className="absolute left-14 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap pointer-events-none translate-x-[-10px] group-hover:translate-x-0">
                        Baixar Documento
                     </div>
                  </div>
                  
                  {/* Botão Salvar (Com Feedback Visual) */}
                  <div className="group relative flex items-center justify-start">
                     <button
                       onClick={handleSaveDraft}
                       disabled={saveStatus === 'loading' || saveStatus === 'success'}
                       className={`w-14 h-14 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center border hover:scale-110 active:scale-95 z-20 ${
                          saveStatus === 'success'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/30'
                            : 'bg-white text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-500/20'
                       }`}
                       title="Salvar"
                     >
                       {saveStatus === 'loading' ? (
                         <Loader2 className="w-6 h-6 animate-spin" />
                       ) : saveStatus === 'success' ? (
                         <Check className="w-6 h-6 animate-bounce" />
                       ) : (
                         <Save className="w-6 h-6" />
                       )}
                     </button>
                     <div className="absolute left-14 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap pointer-events-none translate-x-[-10px] group-hover:translate-x-0">
                        {saveStatus === 'success' ? 'Salvo!' : 'Salvar Alterações'}
                     </div>
                  </div>

                  {/* Botão Editar */}
                  <div className="group relative flex items-center justify-start">
                     <button
                       onClick={() => setIsSidebarOpen(true)}
                       className="w-14 h-14 bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-2xl shadow-lg hover:shadow-indigo-500/10 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-20"
                       title="Editar"
                     >
                       <Edit3 className="w-6 h-6" />
                     </button>
                     <div className="absolute left-14 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap pointer-events-none translate-x-[-10px] group-hover:translate-x-0">
                        Abrir Editor
                     </div>
                  </div>

                  {/* Legendas Verticais Permanentes (Opcional - Estilo Visual) */}
                  <div className="absolute top-0 left-16 h-full w-32 pointer-events-none flex flex-col justify-between py-2 opacity-0 md:opacity-100">
                      <div className="flex items-center h-14 pl-1">
                         <span className="font-bold text-indigo-900 bg-white/80 backdrop-blur px-3 py-1 rounded-lg shadow-sm border border-indigo-100 text-sm">Gerar PDF</span>
                      </div>
                      <div className="flex items-center h-14 pl-1">
                         <span className={`font-bold px-3 py-1 rounded-lg shadow-sm border text-sm transition-colors ${
                            saveStatus === 'success' 
                                ? 'text-emerald-800 bg-emerald-100 border-emerald-200' 
                                : 'text-emerald-700 bg-white/80 backdrop-blur border-emerald-100'
                         }`}>
                             {saveStatus === 'success' ? 'Salvo!' : 'Salvar'}
                         </span>
                      </div>
                      <div className="flex items-center h-14 pl-1">
                         <span className="font-bold text-slate-600 bg-white/80 backdrop-blur px-3 py-1 rounded-lg shadow-sm border border-slate-200 text-sm">Editar</span>
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