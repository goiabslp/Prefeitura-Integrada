
import React, { useState, useRef, useEffect } from 'react';
import { 
  AppState, User, Order, Signature, BlockType, Person, Sector, Job 
} from './types';
import { INITIAL_STATE, DEFAULT_USERS, MOCK_SIGNATURES } from './constants';
import * as db from './services/dbService';

// Components
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { AdminSidebar } from './components/AdminSidebar';
import { DocumentPreview } from './components/DocumentPreview';
import { AdminDocumentPreview } from './components/AdminDocumentPreview';
import { UserManagementScreen } from './components/UserManagementScreen';
import { EntityManagementScreen } from './components/EntityManagementScreen';
import { SignatureManagementScreen } from './components/SignatureManagementScreen';
import { UIPreviewScreen } from './components/UIPreviewScreen';
import { AppHeader } from './components/AppHeader';
import { FinalizedActionBar } from './components/FinalizedActionBar';
import { PurchaseManagementScreen } from './components/PurchaseManagementScreen';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'home' | 'admin' | 'tracking' | 'editor' | 'purchase-management'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [activeBlock, setActiveBlock] = useState<BlockType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [signatures, setSignatures] = useState<Signature[]>(MOCK_SIGNATURES);
  const [globalCounter, setGlobalCounter] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  const [persons, setPersons] = useState<Person[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<string | null>(null);
  const [isFinalizedView, setIsFinalizedView] = useState(false);

  // States for background download from history
  const [snapshotToDownload, setSnapshotToDownload] = useState<AppState | null>(null);
  const backgroundPreviewRef = useRef<HTMLDivElement>(null);

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedOrders = await db.getAllOrders();
        setOrders(savedOrders);
        const savedUsers = await db.getAllUsers();
        if (savedUsers.length > 0) setUsers(savedUsers);
        const savedSigs = await db.getAllSignatures();
        if (savedSigs.length > 0) setSignatures(savedSigs);
        const savedSettings = await db.getGlobalSettings();
        if (savedSettings) setAppState(savedSettings);
        
        const savedPersons = await db.getAllPersons();
        setPersons(savedPersons);
        const savedSectors = await db.getAllSectors();
        setSectors(savedSectors);
        const savedJobs = await db.getAllJobs();
        setJobs(savedJobs);

        const counterValue = await db.getGlobalCounter();
        setGlobalCounter(counterValue);

      } catch (err) {
        console.error("Failed to load local database", err);
      }
    };
    loadData();
  }, []);

  const handleLogin = (u: string, p: string) => {
    const user = users.find(user => user.username === u && user.password === p);
    if (user) {
      setCurrentUser(user);
      setCurrentView('home');
      return true;
    }
    return false;
  };

  const handleFinish = async () => {
    if (!currentUser || !activeBlock) return;
    
    let finalOrder: Order;

    if (editingOrder) {
      const updatedSnapshot = JSON.parse(JSON.stringify(appState));
      updatedSnapshot.content.protocol = editingOrder.protocol; // Mantém o protocolo original no snapshot

      finalOrder = {
        ...editingOrder,
        title: appState.content.title,
        documentSnapshot: updatedSnapshot
      };
      await db.saveOrder(finalOrder);
      setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
    } else {
      const nextVal = await db.incrementGlobalCounter();
      setGlobalCounter(nextVal);
      const protocolString = `${activeBlock.toUpperCase()}-${nextVal.toString().padStart(3, '0')}/${new Date().getFullYear()}`;

      const finalSnapshot = JSON.parse(JSON.stringify(appState));
      finalSnapshot.content.protocol = protocolString; // Salva protocolo no snapshot

      finalOrder = {
        id: Date.now().toString(),
        protocol: protocolString,
        title: appState.content.title,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        blockType: activeBlock,
        documentSnapshot: finalSnapshot,
        paymentStatus: activeBlock === 'diarias' ? 'pending' : undefined
      };
      await db.saveOrder(finalOrder);
      setOrders(prev => [...prev, finalOrder]);
      setAppState(finalSnapshot); // Atualiza o estado atual para refletir o protocolo no preview imediato
    }
    
    setIsFinalizedView(true);
    setIsAdminSidebarOpen(false);
  };

  const handleSendOrder = async () => {
    if (!currentUser || !activeBlock) return;

    const lastOrder = orders[orders.length - 1];
    
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsDownloading(false);

    alert(`SUCESSO!\n\nO pedido "${appState.content.title}" foi registrado e enviado com sucesso para análise administrativa.\n\nProtocolo: ${lastOrder?.protocol || '---'}`);
    
    handleGoHome();
  };

  const handleEditOrder = (order: Order) => {
    if (order.documentSnapshot) setAppState(order.documentSnapshot);
    setActiveBlock(order.blockType);
    setEditingOrder(order);
    setCurrentView('editor');
    setAdminTab('content');
    setIsAdminSidebarOpen(true);
    setIsFinalizedView(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, status };
        db.saveOrder(updated);
        return updated;
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: 'pending' | 'paid') => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const updated = { 
          ...o, 
          paymentStatus: status,
          paymentDate: status === 'paid' ? new Date().toISOString() : undefined
        };
        db.saveOrder(updated);
        return updated;
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  // Função genérica de download
  const performDownload = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return Promise.reject("Element not found");

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
          scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' }
    };

    // @ts-ignore
    return window.html2pdf().from(element).set(opt).save();
  };

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    performDownload('preview-scaler', `${appState.content.title || 'documento'}.pdf`)
      .finally(() => setIsDownloading(false));
  };

  // Lógica para baixar a partir do Histórico
  const handleDownloadFromHistory = async (order: Order) => {
    if (!order.documentSnapshot) return;
    
    setIsDownloading(true);
    setSnapshotToDownload(order.documentSnapshot);
    
    // Pequeno delay para garantir que o React renderize o container oculto
    setTimeout(async () => {
      try {
        await performDownload('background-preview-scaler', `${order.title || 'documento'}.pdf`);
      } catch (err) {
        console.error("Erro no download do histórico:", err);
      } finally {
        setSnapshotToDownload(null);
        setIsDownloading(false);
      }
    }, 500);
  };

  const stats = {
    totalGenerated: globalCounter,
    historyCount: orders.length,
    activeUsers: users.length
  };

  const handleOpenAdmin = (tab?: string | null) => {
    setCurrentView('admin');
    setAdminTab(tab || null);
    setIsAdminSidebarOpen(true);
    setIsFinalizedView(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setActiveBlock(null);
    setIsFinalizedView(false);
    setEditingOrder(null);
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setActiveBlock(null);
    setIsAdminSidebarOpen(false);
    setAdminTab(null);
    setIsFinalizedView(false);
    setEditingOrder(null);
  };

  const handleStartEditing = () => {
      let defaultTitle = INITIAL_STATE.content.title;
      if (activeBlock === 'compras') defaultTitle = 'Requisição de Compra';
      if (activeBlock === 'licitacao') defaultTitle = 'Processo Licitatório nº 01/2024';
      if (activeBlock === 'diarias') defaultTitle = 'Requisição de Diária';

      setAppState(prev => ({
        ...prev,
        content: { 
          ...INITIAL_STATE.content, 
          title: defaultTitle,
          protocol: '' // Limpa protocolo para novos documentos
        },
        document: { 
          ...prev.document, 
          showSignature: INITIAL_STATE.document.showSignature,
          showLeftBlock: INITIAL_STATE.document.showLeftBlock,
          showRightBlock: INITIAL_STATE.document.showRightBlock
        }
      }));
      setEditingOrder(null);
      setCurrentView('editor');
      setAdminTab('content');
      setIsAdminSidebarOpen(true);
      setIsFinalizedView(false);
  };

  if (currentView === 'login') return <LoginScreen onLogin={handleLogin} uiConfig={appState.ui} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans flex-col">
      {currentUser && (
        <AppHeader 
          currentUser={currentUser}
          uiConfig={appState.ui}
          activeBlock={activeBlock}
          onLogout={handleLogout}
          onOpenAdmin={handleOpenAdmin}
          onGoHome={handleGoHome}
          currentView={currentView}
        />
      )}

      <div className="flex-1 flex relative overflow-hidden">
        {currentView === 'home' && currentUser && (
          <HomeScreen 
            onNewOrder={handleStartEditing}
            onTrackOrder={() => setCurrentView('tracking')}
            onManagePurchaseOrders={() => setCurrentView('purchase-management')}
            onLogout={handleLogout}
            onOpenAdmin={handleOpenAdmin}
            userRole={currentUser.role}
            userName={currentUser.name}
            permissions={currentUser.permissions}
            activeBlock={activeBlock}
            setActiveBlock={setActiveBlock}
            stats={stats}
          />
        )}

        {(currentView === 'editor' || currentView === 'admin') && currentUser && (
          <div className="flex-1 flex overflow-hidden h-full relative">
            
            {!isFinalizedView && (
              <AdminSidebar 
                state={appState}
                onUpdate={setAppState}
                onPrint={() => window.print()}
                isOpen={isAdminSidebarOpen}
                onClose={() => { 
                  if (currentView === 'editor') {
                    setIsFinalizedView(true);
                    setIsAdminSidebarOpen(false);
                  } else {
                    setIsAdminSidebarOpen(false);
                    if (currentView === 'admin') setAdminTab(null);
                  }
                }}
                isDownloading={isDownloading}
                currentUser={currentUser}
                mode={currentView === 'admin' ? 'admin' : 'editor'}
                onSaveDefault={() => db.saveGlobalSettings(appState)}
                onFinish={handleFinish}
                activeTab={adminTab}
                onTabChange={setAdminTab}
                availableSignatures={signatures}
                activeBlock={activeBlock}
                persons={persons}
                sectors={sectors}
                jobs={jobs}
              />
            )}
            
            <main className="flex-1 h-full overflow-hidden flex flex-col relative">
              {currentView === 'admin' && adminTab === 'users' ? (
                <UserManagementScreen 
                  users={users}
                  currentUser={currentUser}
                  onAddUser={u => { db.saveUser(u); setUsers(p => [...p, u]); }}
                  onUpdateUser={u => { db.saveUser(u); setUsers(p => p.map(us => us.id === u.id ? u : us)); }}
                  onDeleteUser={id => { db.deleteUser(id); setUsers(p => p.filter(u => u.id !== id)); }}
                  availableSignatures={signatures}
                />
              ) : currentView === 'admin' && adminTab === 'entities' ? (
                <EntityManagementScreen 
                  persons={persons} sectors={sectors} jobs={jobs}
                  onAddPerson={p => { db.savePerson(p); setPersons(prev => [...prev, p]); }}
                  onUpdatePerson={p => { db.savePerson(p); setPersons(prev => prev.map(x => x.id === p.id ? p : x)); }}
                  onDeletePerson={id => { db.deletePerson(id); setPersons(prev => prev.filter(x => x.id !== id)); }}
                  onAddSector={s => { db.saveSector(s); setSectors(prev => [...prev, s]); }}
                  onUpdateSector={s => { db.saveSector(s); setSectors(prev => prev.map(x => x.id === s.id ? s : x)); }}
                  onDeleteSector={id => { db.deleteSector(id); setSectors(prev => prev.filter(x => x.id !== id)); }}
                  onAddJob={j => { db.saveJob(j); setJobs(prev => [...prev, j]); }}
                  onUpdateJob={j => { db.saveJob(j); setJobs(prev => prev.map(x => x.id === j.id ? j : x)); }}
                  onDeleteJob={id => { db.deleteJob(id); setJobs(prev => prev.filter(x => x.id !== id)); }}
                />
              ) : currentView === 'admin' && adminTab === 'signatures' ? (
                <SignatureManagementScreen 
                  signatures={signatures}
                  currentUser={currentUser}
                  onAddSignature={s => { db.saveSignature(s); setSignatures(p => [...p, s]); }}
                  onUpdateSignature={s => { db.saveSignature(s); setSignatures(p => p.map(si => si.id === s.id ? s : si)); }}
                  onDeleteSignature={id => { db.deleteSignature(id); setSignatures(p => p.filter(s => s.id !== id)); }}
                />
              ) : currentView === 'admin' && adminTab === 'ui' ? (
                <UIPreviewScreen ui={appState.ui} />
              ) : currentView === 'admin' && adminTab === 'design' ? (
                <AdminDocumentPreview state={appState} />
              ) : (
                <DocumentPreview 
                  ref={componentRef}
                  state={appState}
                  isGenerating={isDownloading}
                  mode={currentView === 'admin' ? 'admin' : 'editor'}
                  blockType={activeBlock}
                />
              )}

              {isFinalizedView && (
                <FinalizedActionBar 
                    onDownload={handleDownloadPdf}
                    onBack={handleGoHome}
                    onEdit={() => { setIsFinalizedView(false); setIsAdminSidebarOpen(true); }}
                    onSend={handleSendOrder}
                    showSendButton={activeBlock === 'compras'}
                    isDownloading={isDownloading}
                    documentTitle={appState.content.title}
                />
              )}
            </main>
          </div>
        )}

        {currentView === 'tracking' && currentUser && (
          <TrackingScreen 
            onBack={() => setCurrentView('home')}
            currentUser={currentUser}
            activeBlock={activeBlock}
            orders={orders}
            onDownloadPdf={(snapshot) => {
               const order = orders.find(o => o.documentSnapshot === snapshot);
               if (order) handleDownloadFromHistory(order);
            }}
            onClearAll={() => { db.clearAllOrders(); setOrders([]); }}
            onEditOrder={handleEditOrder}
            onDeleteOrder={id => { db.deleteOrder(id); setOrders(p => p.filter(o => o.id !== id)); }}
            totalCounter={globalCounter}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        )}

        {currentView === 'purchase-management' && currentUser && (
          <PurchaseManagementScreen 
            onBack={() => setCurrentView('home')}
            currentUser={currentUser}
            orders={orders}
            onDownloadPdf={(snapshot) => {
               const order = orders.find(o => o.documentSnapshot === snapshot);
               if (order) handleDownloadFromHistory(order);
            }}
            onUpdateStatus={handleUpdateOrderStatus}
            onDeleteOrder={id => { db.deleteOrder(id); setOrders(p => p.filter(o => o.id !== id)); }}
          />
        )}
      </div>

      <div 
        id="background-pdf-generation-container" 
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {snapshotToDownload && (
          <DocumentPreview 
            ref={backgroundPreviewRef}
            state={snapshotToDownload}
            isGenerating={true}
            blockType={snapshotToDownload.content.subType ? 'diarias' : (activeBlock || 'oficio')}
            customId="background-preview-scaler"
          />
        )}
      </div>
    </div>
  );
};

export default App;
