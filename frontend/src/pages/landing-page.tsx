import { ArrowRight, BadgeCheck, BookOpen, HeartPulse, Search, Shield, Sparkles, Stethoscope, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { HealthcareIllustration } from '@/components/sections/healthcare-illustration';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME, MEDICAL_DISCLAIMER, featureHighlights } from '@/lib/constants';

const trustBadges = [
  { icon: Timer, label: 'Just 3 minutes' },
  { icon: Search, label: 'Completely free' },
  { icon: BookOpen, label: 'Detailed dosage info' },
];

const browseCategories = [
  { label: 'By Symptom', active: true },
  { label: 'By Disease', active: false },
  { label: 'By Body Part', active: false },
  { label: 'By Specialty', active: false },
];

const popularSymptoms = [
  'Headache', 'Cough', 'Nausea', 'Fever',
  'Fatigue', 'Acidity', 'Cold', 'Body Pain',
  'Vomiting', 'Eye Irritation', 'Sore Throat', 'Diarrhoea',
];

const featureIcons = [Stethoscope, Shield, HeartPulse];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.07, ease: 'easeOut' as const } }),
};

export function LandingPage() {
  return (
    <div id="top" className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Medical disclaimer bar — matches prototype */}
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-900 sm:text-sm">
        <span className="font-semibold">⚠ Medical Disclaimer:</span>{' '}
        {MEDICAL_DISCLAIMER}
      </div>

      <main className="flex-1">
        {/* ── Hero Section ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-hero-gradient">
          <div className="absolute inset-0 mesh-bg opacity-50" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">

            {/* Left — Hero copy */}
            <div className="flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="space-y-6"
              >
                <Badge variant="soft" className="w-fit gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Smart Medicine Guide
                </Badge>

                <div>
                  <h1 className="max-w-xl font-sans text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-[4.25rem]">
                    Check your symptoms,
                  </h1>
                  <p className="mt-2 font-display text-4xl italic text-teal-700 sm:text-5xl lg:text-[3.5rem]">
                    find possible causes
                  </p>
                </div>

                <p className="max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                  Enter your symptoms and get personalised medicine suggestions, dosage guides, and health instructions — all in one place.{' '}
                  <span className="font-semibold text-slate-800">Free. Fast. Trustworthy.</span>
                </p>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-3">
                  {trustBadges.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      <Icon className="h-4 w-4 text-teal-600" />
                      {label}
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="shadow-soft">
                    <Link to="/auth/login">
                      Start a Symptom Check
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/app/symptoms">Browse Conditions</Link>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  By using this tool, you agree to our{' '}
                  <a href="#privacy" className="underline underline-offset-2 hover:text-teal-700">Privacy Policy</a>{' '}
                  and{' '}
                  <a href="#terms" className="underline underline-offset-2 hover:text-teal-700">Terms of Use</a>.
                </p>
              </motion.div>
            </div>

            {/* Right — Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
              className="relative flex items-center justify-center"
            >
              <HealthcareIllustration />
            </motion.div>
          </div>
        </section>

        {/* ── Browse & Begin Section ─────────────────────────────────────── */}
        <section className="border-y border-border/60 bg-white py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-teal-700">Browse &amp; Begin</p>
              <h2 className="mt-4 font-sans text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Start with{' '}
                <span className="font-display italic text-teal-700">what you know</span>
              </h2>
            </motion.div>

            {/* Category tabs */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {browseCategories.map((cat, i) => (
                <motion.div key={cat.label} custom={i} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link
                    to={cat.active ? '/app/symptoms' : '#'}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                      cat.active
                        ? 'bg-teal-700 text-white shadow-soft hover:bg-teal-800'
                        : 'border border-border bg-white text-slate-700 hover:border-teal-300 hover:text-teal-700'
                    }`}
                  >
                    {cat.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Symptom pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {popularSymptoms.map((symptom, i) => (
                <motion.div key={symptom} custom={i} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link
                    to="/app/symptoms"
                    className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                  >
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    {symptom}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link to="/app/symptoms" className="text-sm font-semibold text-teal-700 underline underline-offset-4 transition hover:text-teal-900">
                Start full symptom check →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Feature Highlights Section ─────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Why teams use it</p>
            <h2 className="mt-4 font-sans text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              A trustworthy UI for a{' '}
              <span className="font-display italic text-teal-700">sensitive workflow</span>
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featureHighlights.map((feature, index) => {
              const Icon = featureIcons[index] ?? BadgeCheck;
              return (
                <motion.div
                  key={feature.title}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <Card className="group h-full border-border/60 bg-white transition hover:-translate-y-1 hover:shadow-card">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="mt-3 text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base leading-7">{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Built for Confidence Section ───────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-teal-100/80 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 text-white">
            <CardContent className="grid gap-10 p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-14">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-200">Built for confidence</p>
                <h3 className="mt-4 font-sans text-3xl font-extrabold leading-tight sm:text-4xl">
                  Clear guidance, minimal friction,{' '}
                  <span className="font-display italic text-cyan-200">and premium polish.</span>
                </h3>
                <p className="mt-5 max-w-2xl text-base leading-7 text-teal-100">
                  This platform is structured to scale: protected routes, typed API calls, reusable UI primitives, and responsive layouts from phones through large displays.
                </p>
                <Button asChild size="lg" variant="soft" className="mt-8 border-white/30 bg-white text-teal-800 hover:bg-teal-50">
                  <Link to="/auth/login">
                    Get started for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 self-center sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { label: 'Security', value: 'JWT session handling with refresh token support.' },
                  { label: 'Accessibility', value: 'Keyboard-friendly controls and mobile-first spacing.' },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">{item.label}</p>
                    <p className="mt-2 text-base font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── APP_NAME brand banner ──────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-4xl border border-border/60 bg-gradient-to-r from-teal-50 to-cyan-50 p-8 text-center sm:p-12">
            <p className="font-display text-3xl italic text-teal-700 sm:text-4xl">"{APP_NAME} keeps it safe, simple, and fast."</p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.28em] text-teal-600">Platform tagline</p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}