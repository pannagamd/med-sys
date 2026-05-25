import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeartPulse, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/services/api/client';
import { getProfile, safetyCheck, updateProfile } from '@/services/api/profile';
import { addHistoryItem } from '@/lib/history';
import { parseListInput } from '@/lib/parsers';
import { severityBadgeVariant, severityTone } from '@/lib/severity';
import type { HealthProfile, ProfileSafetyCheckResponse } from '@/types/api';

const safetySchema = z.object({ medicines: z.string().min(2, 'Add at least one medicine') });
type SafetyValues = z.infer<typeof safetySchema>;

export function PregnancySafetyPage() {
  const form = useForm<SafetyValues>({ resolver: zodResolver(safetySchema), defaultValues: { medicines: 'Ibuprofen' } });
  const profileForm = useForm<HealthProfile>({ defaultValues: { gender: 'female', is_pregnant: true, is_lactating: false } as HealthProfile });
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [result, setResult] = useState<ProfileSafetyCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentProfile = await getProfile();
        if (currentProfile) {
          setProfile(currentProfile);
          profileForm.reset(currentProfile);
        }
      } catch {
        // The page remains usable even if profile lookup fails.
      }
    }

    loadProfile();
  }, [profileForm]);

  async function handleProfileUpdate(values: HealthProfile) {
    try {
      const updated = await updateProfile(values);
      setProfile(updated);
      profileForm.reset(updated);
      toast.success('Profile updated.');
      addHistoryItem({ kind: 'profile', title: 'Updated health profile', detail: 'Pregnancy and medication context saved locally and remotely.' });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleCheck(values: SafetyValues) {
    const medicines = parseListInput(values.medicines);
    if (!medicines.length) {
      toast.error('Enter one or more medicines.');
      return;
    }

    setLoading(true);
    try {
      const data = await safetyCheck(medicines);
      setResult(data);
      addHistoryItem({ kind: 'pregnancy', title: `Pregnancy safety check: ${medicines.join(', ')}`, detail: `${data.profile_warnings.length} warning(s) returned` });
      toast.success('Pregnancy safety check complete.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const isFemale = profileForm.watch('gender')?.toLowerCase() === 'female';
  const isPregnant = Boolean(profileForm.watch('is_pregnant'));

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <CardHeader>
            <Badge variant="soft" className="w-fit gap-2 px-3 py-2 text-sm">
              <HeartPulse className="h-4 w-4" />
              Pregnancy safety checker
            </Badge>
            <CardTitle className="mt-3 text-4xl">Screen medicines against pregnancy-aware profile context.</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              This workflow is intentionally conservative. If the profile is not female or not pregnant, the UI still explains that the checker is intended for pregnancy and lactation use cases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isFemale ? (
              <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                This screen is designed for female pregnancy workflows. Update the profile details if that context applies.
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={form.handleSubmit(handleCheck)}>
              <Textarea rows={5} placeholder="Ibuprofen, Metformin" {...form.register('medicines')} />
              {form.formState.errors.medicines ? <p className="text-sm text-rose-600">{form.formState.errors.medicines.message}</p> : null}
              <Button type="submit" disabled={loading}>
                {loading ? 'Checking...' : 'Run pregnancy safety check'}
                <Sparkles className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile context</CardTitle>
            <CardDescription>Update pregnancy-relevant fields before running the check.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={profileForm.handleSubmit(handleProfileUpdate)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input id="gender" placeholder="female" {...profileForm.register('gender')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" {...profileForm.register('age', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input id="weight" type="number" step="0.1" {...profileForm.register('weight_kg', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-medications">Current medications</Label>
                  <Input id="current-medications" placeholder="Metformin, Prenatal vitamins" {...profileForm.register('current_medications')} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white p-3 text-sm text-slate-700">
                  <Checkbox {...profileForm.register('is_pregnant')} />
                  Pregnant
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white p-3 text-sm text-slate-700">
                  <Checkbox {...profileForm.register('is_lactating')} />
                  Lactating
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea id="allergies" rows={3} placeholder="Penicillin, NSAIDs" {...profileForm.register('allergies')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical-conditions">Medical conditions</Label>
                <Textarea id="medical-conditions" rows={3} placeholder="Diabetes, hypertension" {...profileForm.register('medical_conditions')} />
              </div>

              <Button type="submit" className="w-full">
                Save profile context
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {profile ? (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Current profile summary
              </CardTitle>
              <CardDescription>Use this summary when reviewing the safety output with a clinician.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Gender', value: profile.gender ?? 'Not set' },
                  { label: 'Pregnant', value: profile.is_pregnant ? 'Yes' : 'No' },
                  { label: 'Lactating', value: profile.is_lactating ? 'Yes' : 'No' },
                  { label: 'Current meds', value: profile.current_medications ?? 'None listed' },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border/70 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">{item.label}</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {result ? (
        <section className="space-y-5">
          <Card className={`border ${severityTone(result.profile_warnings.length ? 'moderate' : 'safe')}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2 text-teal-700 shadow-sm">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">Safety result</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{result.profile_warnings.length ? 'Warnings detected' : 'No profile-specific warnings returned'}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{result.medical_disclaimer}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.resolved_medicines.map((medicine) => (
              <Card key={medicine.input} className="border-white/70 bg-white/85">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{medicine.input}</CardTitle>
                      <CardDescription className="mt-2 text-base">Resolved as {medicine.resolved_name}</CardDescription>
                    </div>
                    <Badge variant={medicine.matched ? 'success' : 'outline'}>{medicine.matched ? 'Matched' : 'Approximate'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                  <p><span className="font-semibold text-slate-900">Contraindications:</span> {medicine.contraindications ?? 'Not listed'}</p>
                  <p><span className="font-semibold text-slate-900">Precautions:</span> {medicine.precautions ?? 'Not listed'}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {result.profile_warnings.length ? (
            <Card className="border-amber-200 bg-amber-50/90">
              <CardHeader>
                <CardTitle className="text-amber-900">Warnings</CardTitle>
                <CardDescription className="text-amber-800">Review these before taking any medicine during pregnancy or lactation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {result.profile_warnings.map((warning, index) => (
                  <div key={`${warning.message}-${index}`} className="rounded-2xl border border-amber-200 bg-white p-4 text-sm leading-6 text-amber-900">
                    <Badge variant={severityBadgeVariant(warning.severity)} className="mb-2">{warning.severity}</Badge>
                    <p>{warning.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}