import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Hire from './pages/Hire';
import FrontAdmin from './pages/FrontAdmin';
import InfluencerProgram from './pages/InfluencerProgram';
import AdminHome from './pages/AdminHome';
import AdminSettingsTemplates from './pages/AdminSettingsTemplates';
import AdminSettingsSignature from './pages/AdminSettingsSignature';
import CrmBoard from './pages/CrmBoard';
import AdminGate from './components/AdminGate';
import BoardAccessGate from './components/BoardAccessGate';
import PublicForm from './pages/PublicForm';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const HomePage = mainPageKey ? Pages[mainPageKey] : <></>;

// Domain-based root routing: franchise subdomains show OwnAStudio, all others show Home
const FRANCHISE_HOSTNAMES = ["franchise.pilatesinpinkstudio.com", "franchise.pilatesinpink.ca"];
const isFranchiseDomain = typeof window !== "undefined" && FRANCHISE_HOSTNAMES.includes(window.location.hostname);
const MainPage = isFranchiseDomain ? Pages["OwnAStudio"] : HomePage;
const rootPageKey = isFranchiseDomain ? "OwnAStudio" : mainPageKey;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // PUBLIC SHORT-CIRCUIT — /form must render for everyone with no auth checks,
  // no loading spinner, no layout wrapper. Visitors arriving via a tokenized
  // share link should never be redirected to login or shown the "user not
  // registered" screen.
  if (typeof window !== "undefined" && window.location.pathname.toLowerCase() === "/form") {
    return <PublicForm />;
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle "user not registered" — but DO NOT auto-redirect on auth_required;
  // this app is public, so unauthenticated visitors must be able to view
  // public routes (landing, /Influencer, /Instructor, /FrontAdmin, etc.).
  // Protected routes use <ProtectedRoute /> to gate themselves individually.
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError && authError.type === 'domain_not_allowed') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 max-w-sm w-full text-center">
          <h2 className="text-xl font-light text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm mb-6">
            Sign-in is limited to <span className="font-medium text-slate-700">@pilatesinpinkstudio.com</span> accounts. You've been signed out.
          </p>
          <a
            href="/login"
            className="inline-block w-full h-11 leading-[44px] rounded-xl bg-slate-900 text-white text-sm font-medium"
          >
            Try a different account
          </a>
        </div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={rootPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages)
        .filter(([path]) => path !== "Home" && path !== "InfluencerProgram")
        .map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Influencer" element={
        <LayoutWrapper currentPageName="InfluencerProgram">
          <InfluencerProgram />
        </LayoutWrapper>
      } />
      <Route path="/Instructor" element={<Hire />} />
      <Route path="/FrontAdmin" element={<FrontAdmin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/form" element={<PublicForm />} />
      {/* Protected routes — require a signed-in user */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/Settings" element={<AdminGate><AdminHome /></AdminGate>} />
        <Route path="/Settings/Templates" element={<AdminGate><AdminSettingsTemplates /></AdminGate>} />
        <Route path="/Settings/Signature" element={<AdminGate><AdminSettingsSignature /></AdminGate>} />
        <Route path="/ApplicationBoard" element={<BoardAccessGate><CrmBoard /></BoardAccessGate>} />
      </Route>
      <Route path="/Settings/Submissions" element={<Navigate to="/ApplicationBoard?view=table" replace />} />
      <Route path="/AdminDashboard/*" element={<Navigate to="/Settings" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App