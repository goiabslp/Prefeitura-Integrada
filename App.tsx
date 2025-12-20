
import React, { useState, useRef, useEffect } from 'react';
import { 
  AppState, User, Order, Signature, BlockType 
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
import { SignatureManagementScreen } from './components/SignatureManagementScreen';
import { UIPreviewScreen } from './components/UIPreviewScreen';
import { AppHeader } from './components/AppHeader';

// Main App Component implementing document generation logic
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'home' | 'admin' | 'tracking' | 'editor'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [activeBlock, setActiveBlock] = useState<BlockType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [signatures, setSignatures] = useState<Signature[]>(MOCK_SIGNATURES);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<string | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);

  // Sync data from IndexedDB on component mount
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
      } catch (err) {
        console.error("Failed to load local database", err);
      }
    };
    loadData();
  }, []);

  // Handle user authentication
  const handleLogin = (u: string, p: string) => {
    const user = users.find(user => user.username === u && user.password === p);
    if (user) {
      setCurrentUser(user);
      setCurrentView('home');
      return true;
    }
    return false;
  };

  // Handle document finalization and saving
  const handleFinish = async () => {
    if (!currentUser || !activeBlock) return;
    const newOrder: Order = {
      id: Date.now().toString(),
      protocol: `${activeBlock.toUpperCase()}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}/${new Date().getFullYear()}`,
      title: appState.content.title,
      status: 'completed',
      createdAt: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      blockType: activeBlock,
      documentSnapshot: JSON.parse(JSON.stringify(appState))
    };
    await db.saveOrder(newOrder);
    setOrders(prev => [...prev, newOrder]);
    setCurrentView('home');
    setActiveBlock(null);
  };

  // Logic to reopen a document for editing
  const handleEditOrder = (order: Order) => {
    if (order.documentSnapshot) setAppState(order.documentSnapshot);
    setActiveBlock(order.blockType);
    setCurrentView('editor');
    setAdminTab('content');
    setIsAdminSidebarOpen(true);
  };

  const stats = {
    totalGenerated: orders.length,
    historyCount: orders.length,
    activeUsers: users.length
  };

  const handleOpenAdmin = (tab?: string | null) => {
    setCurrentView('admin');
    // Se nenhum tab for passado, definimos como null para mostrar o menu de módulos
    setAdminTab(tab || null);
    setIsAdminSidebarOpen(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setActiveBlock(null);
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setActiveBlock(null);
    setIsAdminSidebarOpen(false);
    setAdminTab(null);
  };

  // Render conditional screens based on navigation state
  if (currentView === 'login') return <LoginScreen onLogin={handleLogin} uiConfig={appState.ui} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans flex-col">
      {/* Header Global Pós-Login */}
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
            onNewOrder={() => { setCurrentView('editor'); setAdminTab('content'); setIsAdminSidebarOpen(true); }}
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
          <div className="flex-1 flex overflow-hidden h-full">
            <AdminSidebar 
              state={appState}
              onUpdate={setAppState}
              onPrint={() => window.print()}
              isOpen={isAdminSidebarOpen}
              onClose={() => { setIsAdminSidebarOpen(false); if (currentView === 'editor') setCurrentView('home'); }}
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
            
            <main className="flex-1 h-full overflow-hidden flex flex-col">
              {currentView === 'admin' && adminTab === 'users' ? (
                <UserManagementScreen 
                  users={users}
                  currentUser={currentUser}
                  onAddUser={u => { db.saveUser(u); setUsers(p => [...p, u]); }}
                  onUpdateUser={u => { db.saveUser(u); setUsers(p => p.map(us => us.id === u.id ? u : us)); }}
                  onDeleteUser={id => { db.deleteUser(id); setUsers(p => p.filter(u => u.id !== id)); }}
                  availableSignatures={signatures}
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
            totalCounter={orders.length}
          />
        )}
      </div>
    </div>
  );
};

export default App;
