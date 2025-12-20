
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'home' | 'admin' | 'tracking' | 'editor'>('login');
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
      // APENAS ATUALIZA O REGISTRO EXISTENTE
      finalOrder = {
        ...editingOrder,
        title: appState.content.title,
        documentSnapshot: JSON.parse(JSON.stringify(appState))
      };
      await db.saveOrder(finalOrder);
      setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
    } else {
      // CRIA UM NOVO REGISTRO E INCREMENTA O CONTADOR
      const nextVal = await db.incrementGlobalCounter();
      setGlobalCounter(nextVal);

      finalOrder = {
        id: Date.now().toString(),
        protocol: `${activeBlock.toUpperCase()}-${nextVal.toString().padStart(3, '0')}/${new Date().getFullYear()}`,
        title: appState.content.title,
        status: 'completed',
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        blockType: activeBlock,
        documentSnapshot: JSON.parse(JSON.stringify(appState))
      };
      await db.saveOrder(finalOrder);
      setOrders(prev => [...prev, finalOrder]);
    }
    
    setIsFinalizedView(true);
    setIsAdminSidebarOpen(false);
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

  const handleDownloadPdf = () => {
    if (!componentRef.current) return;
    setIsDownloading(true);
    
    const element = document.getElementById('preview-scaler');
    if (!element) {
        setIsDownloading(false);
        return;
    }

    const opt = {
      margin: 0,
      filename: `${appState.content.title || 'documento'}.pdf`,
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
    window.html2pdf().from(element).set(opt).save().then(() => {
      setIsDownloading(false);
    }).catch((err: any) => {
        console.error("Erro ao gerar PDF:", err);
        setIsDownloading(false);
    });
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
            onDownloadPdf={() => {}}
            onClearAll={() => { db.clearAllOrders(); setOrders([]); }}
            onEditOrder={handleEditOrder}
            onDeleteOrder={id => { db.deleteOrder(id); setOrders(p => p.filter(o => o.id !== id)); }}
            totalCounter={globalCounter}
          />
        )}
      </div>
    </div>
  );
};

export default App;
