import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Hire from './pages/Hire';
import FrontAdmin from './pages/FrontAdmin';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/AdminHome';
import AdminMarketing from './pages/AdminMarketing';
import AdminMarketingCampaign from './pages/AdminMarketingCampaign';
import AdminSettings from './pages/AdminSettings';
import AdminSettingsTemplates from './pages/AdminSettingsTemplates';
import AdminSettingsSignature from './pages/AdminSettingsSignature';
import AdminGate from './components/AdminGate';

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
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={rootPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
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
      <Route path="/Instructor" element={<Hire />} />
      <Route path="/FrontAdmin" element={<FrontAdmin />} />
      <Route path="/AdminDashboard" element={<AdminGate><AdminHome /></AdminGate>} />
      <Route path="/AdminDashboard/Submissions" element={<AdminGate><AdminDashboard /></AdminGate>} />
      <Route path="/AdminDashboard/Marketing" element={<AdminGate><AdminMarketing /></AdminGate>} />
      <Route path="/AdminDashboard/Marketing/:slug" element={<AdminGate><AdminMarketingCampaign /></AdminGate>} />
      <Route path="/AdminDashboard/Settings" element={<AdminGate><AdminSettings /></AdminGate>} />
      <Route path="/AdminDashboard/Settings/Templates" element={<AdminGate><AdminSettingsTemplates /></AdminGate>} />
      <Route path="/AdminDashboard/Settings/Signature" element={<AdminGate><AdminSettingsSignature /></AdminGate>} />
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