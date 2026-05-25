import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import { APP_NAME, MEDICAL_DISCLAIMER } from '@/lib/constants';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <span className="font-sans text-xl font-extrabold tracking-tight text-teal-800">
                Medi<span className="text-teal-600">Pulse</span>
              </span>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-800">Platform</h3>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <Link to="/app" className="transition hover:text-teal-800">
                Dashboard
              </Link>
              <Link to="/app/medicines" className="transition hover:text-teal-800">
                Medicine search
              </Link>
              <Link to="/app/interactions" className="transition hover:text-teal-800">
                Interaction checker
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-800">Account</h3>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <Link to="/auth/login" className="transition hover:text-teal-800">
                Sign in
              </Link>
              <Link to="/auth/login" className="transition hover:text-teal-800">
                Create account
              </Link>
              <a href="#top" className="transition hover:text-teal-800">
                Back to top
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Built for local-first medical decision support.</p>
          <p>Responsive UI optimized for mobile, tablet, and desktop.</p>
        </div>
      </div>
    </footer>
  );
}