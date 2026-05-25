import { ArrowRight, FileClock, HeartPulse, Search, Shield, Sparkles, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MEDICAL_DISCLAIMER } from '@/lib/constants';
import { readHistory } from '@/lib/history';
import { formatRelativeDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type { PagedHistoryItem } from '@/types/api';

const quickActions = [
  {
    title: 'Search Medicines',
    description: 'Find medicine details, compositions, and brand-to-generic conversions.',
    href: '/app/medicines',
    icon: Search,
    color: 'bg-teal-50 text-teal-700',
  },
  {
    title: 'Check Interactions',
    description: 'Compare two or more medicines and surface structured severity guidance.',
    href: '/app/interactions',
    icon: Shield,
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Pregnancy Safety',
    description: 'Screen medicines against pregnancy-aware profile context.',
    href: '/app/pregnancy',
    icon: HeartPulse,
    color: 'bg-rose-50 text-rose-700',
  },
  {
    title: 'Symptom Checker',
    description: 'Enter symptoms and get conservative care recommendations.',
    href: '/app/symptoms',
    icon: Stethoscope,
    color: 'bg-cyan-50 text-cyan-700',
  },
];

const kindBadge: Record<PagedHistoryItem['kind'], string> = {
  medicine: 'bg-teal-50 text-teal-700',
  interaction: 'bg-amber-50 text-amber-700',
  pregnancy: 'bg-rose-50 text-rose-700',
  profile: 'bg-slate-50 text-slate-700',
  symptom: 'bg-cyan-50 text-cyan-700',
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.06, ease: 'easeOut' as const },
  }),
};

export function OverviewPage() {
  const user = useAuthStore((state) => state.user);
  const history = readHistory();

  const stats = [
    { label: 'Recent actions', value: `${history.slice(0, 30).length}`, note: 'saved locally' },
    { label: 'Medical stance', value: 'Conservative', note: 'safety-first guidance' },
    { label: 'Session', value: user ? 'Verified' : 'Guest', note: 'phone authentication' },
    { label: 'Access', value: user?.is_admin ? 'Admin' : 'User', note: 'role-based routes' },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome Hero ────────────────────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden border-teal-100/80 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 text-white">
          <CardContent className="p-8 lg:p-10">
            <Badge variant="soft" className="w-fit border-white/20 bg-white/10 text-white">
              <Sparkles className="h-4 w-4" />
              Secure dashboard
            </Badge>
            <h1 className="mt-5 font-sans text-3xl font-extrabold leading-tight sm:text-4xl">
              Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
            </h1>
            <p className="mt-2 font-display text-xl italic text-teal-200 sm:text-2xl">
              Your medicine safety workspace is ready.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-teal-100">
              Search local medicines, compare interactions, and update your profile context without leaving the dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="soft" className="border-white/25 bg-white text-teal-800 shadow-soft hover:bg-teal-50">
                <Link to="/app/medicines">
                  Start medicine search
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="soft" className="border-white/25 bg-white/15 text-white hover:bg-white/25">
                <Link to="/app/history">View history</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session snapshot</CardTitle>
            <CardDescription>Your current account and safety context at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.note}</p>
                </div>
                <p className="text-base font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* ── Quick Actions Grid ───────────────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">Quick actions</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Move through the core workflows
            </h2>
          </div>
          <Link to="/app/history" className="hidden items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 sm:inline-flex">
            <FileClock className="h-4 w-4" />
            History
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.title} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <Link to={action.href} className="block h-full">
                  <Card className="group h-full cursor-pointer border-border/60 bg-white transition hover:-translate-y-1 hover:shadow-card">
                    <CardHeader className="pb-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:scale-110 ${action.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="mt-3 text-lg">{action.title}</CardTitle>
                      <CardDescription className="leading-6">{action.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1 text-sm font-semibold text-teal-700 group-hover:text-teal-800">
                        Open
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Recent Activity ──────────────────────────────────────────── */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Items are stored locally — persists between visits without backend coupling.</CardDescription>
            </div>
            <Link to="/app/history">
              <Button variant="outline" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {history.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {history.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${kindBadge[item.kind] ?? 'bg-slate-50 text-slate-700'}`}>
                        {item.kind}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatRelativeDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950 line-clamp-1">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <FileClock className="h-7 w-7" />
                </div>
                <p className="text-lg font-semibold text-slate-950">No saved activity yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use medicine search or interaction checks to populate your history.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/app/medicines">Search medicines</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Medical Disclaimer ───────────────────────────────────────── */}
      <section>
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 px-6 py-4 text-sm leading-6 text-amber-900">
          <span className="font-semibold">Medical Disclaimer: </span>
          {MEDICAL_DISCLAIMER}
        </div>
      </section>
    </div>
  );
}