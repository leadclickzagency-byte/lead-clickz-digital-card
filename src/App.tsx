import { useEffect, useState } from 'react';
import { Route, Switch, useRoute } from 'wouter';
import type { ProfileSlug } from '@/data/profiles';
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

/** Embedded preview build (VITE_EMBED=1): the card is chosen with a plain #thomas / #tiffany
 * anchor and a small switcher, since the preview host only passes simple anchors through. */
const EMBED = import.meta.env.VITE_EMBED === '1';

function slugFromHash(): ProfileSlug {
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return getLeadClickzProfile(h)?.slug ?? 'thomas';
}

function EmbedApp() {
  const [slug, setSlug] = useState<ProfileSlug>(slugFromHash);
  useEffect(() => {
    const onHash = () => setSlug(slugFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const profile = leadClickzProfiles[slug];
  return (
    <>
      <nav className="card-switcher" aria-label="Choose a card">
        {Object.values(leadClickzProfiles).map((p) => (
          <a key={p.slug} href={`#${p.slug}`} className={slug === p.slug ? 'is-on' : ''}>
            {p.firstName}
          </a>
        ))}
      </nav>
      <Experience key={profile.slug} profile={profile} />
    </>
  );
}

export function App() {
  return EMBED ? <EmbedApp /> : <Routes />;
}

function Routes() {
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
