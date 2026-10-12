import { Route, Switch, useRoute } from 'wouter';
import { getLeadClickzProfile, leadClickzProfiles } from '@/data/profiles';
import { Experience } from '@/experience/Experience';
import { BoltMark } from '@/experience/Icons';

function ProfileRoute() {
  const [, params] = useRoute('/:slug');
  const profile = params ? getLeadClickzProfile(params.slug) : undefined;
  return profile ? <Experience key={profile.slug} profile={profile} /> : <NotFound />;
}

function NotFound() {
  return (
    <main className="not-found">
      <BoltMark size={72} glow />
      <h1>That card isn’t live.</h1>
      <p>The link may be mistyped. Meet the Lead Clickz™ team instead:</p>
      <nav>
        {Object.values(leadClickzProfiles).map((p) => (
          <a key={p.slug} className="btn btn--ghost" href={`/${p.slug}`}>
            {p.name}
          </a>
        ))}
      </nav>
    </main>
  );
}

export function App() {
  return (
    <Switch>
      <Route path="/">
        <Experience profile={leadClickzProfiles.thomas} />
      </Route>
      <Route path="/:slug" component={ProfileRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}
