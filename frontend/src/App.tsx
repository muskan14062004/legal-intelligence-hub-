import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ChatPage } from './pages/ChatPage';
import { SemanticSearchPage } from './pages/SemanticSearchPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { DocumentViewerPage } from './pages/DocumentViewerPage';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [pageParams, setPageParams] = useState<any>({});

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 font-semibold tracking-wide">
          Initializing Legal Intelligence Hub...
        </p>
      </div>
    );
  }

  // Route protection
  const isPublicPage = ['landing', 'login', 'register'].includes(currentPage);
  if (!isAuthenticated && !isPublicPage) {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  // If user is logged in and visits landing, allow or default to dashboard
  if (!isAuthenticated && currentPage === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'login') {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'register') {
    return <RegisterPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onNavigate={handleNavigate} />
      <div className="flex-1 flex">
        {isAuthenticated && (
          <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
        )}
        <main className="flex-1 min-w-0">
          {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {currentPage === 'documents' && <DocumentsPage onNavigate={handleNavigate} />}
          {currentPage === 'chat' && (
            <ChatPage
              onNavigate={handleNavigate}
              initialDocumentId={pageParams?.documentId}
            />
          )}
          {currentPage === 'search' && <SemanticSearchPage onNavigate={handleNavigate} />}
          {currentPage === 'analysis' && (
            <RiskAnalysisPage
              onNavigate={handleNavigate}
              initialDocumentId={pageParams?.documentId}
            />
          )}
          {currentPage === 'viewer' && (
            <DocumentViewerPage
              documentId={pageParams?.documentId}
              initialPage={pageParams?.page || 1}
              onNavigate={handleNavigate}
            />
          )}
          {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
