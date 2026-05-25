import { motion } from 'framer-motion';
import { ActivitySquare, HeartPulse, Shield, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const symptoms = [
  { label: 'Persistent headache', severity: 'High', variant: 'danger' as const, icon: ActivitySquare },
  { label: 'Fatigue & tiredness', severity: 'Moderate', variant: 'warning' as const, icon: HeartPulse },
  { label: 'Mild fever', severity: 'Low', variant: 'success' as const, icon: Shield },
];

export function HealthcareIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      {/* Ambient glow blob */}
      <div className="absolute inset-x-8 top-8 h-52 rounded-[3rem] bg-teal-300/20 blur-3xl" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Main card */}
        <Card className="glass-panel overflow-hidden border-white/60">
          {/* Header strip */}
          <div className="border-b border-teal-400/30 bg-gradient-to-r from-teal-600 to-cyan-500 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">Medicine guide active</p>
                <p className="text-base font-semibold">Personalised to your profile</p>
              </div>
            </div>
          </div>

          <CardContent className="space-y-3 p-5">
            {symptoms.map(({ label, severity, variant, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-teal-100/80 bg-teal-50/60 px-4 py-3.5 shadow-sm"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="flex-1 text-sm font-medium text-slate-900">{label}</p>
                <Badge variant={variant} className="text-xs">{severity}</Badge>
              </div>
            ))}

            {/* Progress bar */}
            <div className="rounded-2xl border border-dashed border-teal-200 bg-white/80 p-4">
              <div className="mb-2.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Matching medicines</span>
                <span className="font-semibold text-teal-700">65%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-teal-100">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="soft" className="gap-2 px-3 py-2 text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                50+ medicines covered
              </Badge>
              <Badge variant="outline" className="gap-2 px-3 py-2 text-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Conservative safety checks
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Floating badge — top left */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -left-5 top-8 hidden sm:block"
        >
          <Card className="glass-panel w-42 border-white/70 px-4 py-3 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">10M+</p>
                <p className="text-xs text-muted-foreground">users helped</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Floating badge — bottom right */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-5 right-4 hidden sm:block"
        >
          <Card className="glass-panel w-54 border-white/70 px-4 py-3 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Safe by design</p>
                <p className="text-xs text-muted-foreground">Profile-aware recommendations</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}