import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppShell } from '@/components/app-shell';
import { ProfileExperience } from '@/components/profile-experience';
import {
  getLeadClickzProfile,
  leadClickzProfiles,
} from '@/data/profiles';
import NotFound from '@/pages/not-found';
import {
  Route,
  Router as WouterRouter,
  Switch,
  useRoute,
  useLocation,
} from 'wouter';

function Home() {
  return <ProfileExperience profile={leadClickzProfiles.thomas} />;
}

function ProfileRoute() {
  const [, params] = useRoute('/:profileSlug');
  const profile = params
    ? getLeadClickzProfile(params.profileSlug)
    : undefined;

  return profile ? <ProfileExperience profile={profile} /> : <NotFound />;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/:profileSlug" component={ProfileRoute} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;