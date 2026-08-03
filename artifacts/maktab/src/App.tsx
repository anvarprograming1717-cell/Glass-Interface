import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { LanguageProvider } from '@/i18n/use-translation';
import { useAuthStore } from '@/store/use-auth';
import { Layout } from '@/components/Layout';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Grades from '@/pages/Grades';
import Attendance from '@/pages/Attendance';
import Assignments from '@/pages/Assignments';
import Announcements from '@/pages/Announcements';
import Messages from '@/pages/Messages';
import Notifications from '@/pages/Notifications';
import Directory from '@/pages/Directory';
import Settings from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { role } = useAuthStore();
  const [location, setLocation] = useLocation();

  if (!role) {
    // Need to wait for render cycle to redirect properly in wouter sometimes, but simple setLocation works
    requestAnimationFrame(() => setLocation('/login'));
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/grades" component={() => <ProtectedRoute component={Grades} />} />
        <Route path="/attendance" component={() => <ProtectedRoute component={Attendance} />} />
        <Route path="/assignments" component={() => <ProtectedRoute component={Assignments} />} />
        <Route path="/announcements" component={() => <ProtectedRoute component={Announcements} />} />
        <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />
        <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
        <Route path="/students" component={() => <ProtectedRoute component={() => <Directory type="student" />} />} />
        <Route path="/teachers" component={() => <ProtectedRoute component={() => <Directory type="teacher" />} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
