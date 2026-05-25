import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addHistoryItem } from '@/lib/history';
import { getApiErrorMessage } from '@/services/api/client';
import { getProfile, updateProfile } from '@/services/api/profile';
import type { HealthProfile } from '@/types/api';

export function ProfilePage() {
  const form = useForm<HealthProfile>({ defaultValues: { gender: 'female', is_pregnant: false, is_lactating: false } as HealthProfile });
  const [profile, setProfile] = useState<HealthProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentProfile = await getProfile();
        if (currentProfile) {
          setProfile(currentProfile);
          form.reset(currentProfile);
        }
      } catch {
        // No profile yet; the form remains ready for input.
      }
    }

    loadProfile();
  }, [form]);

  async function handleSave(values: HealthProfile) {
    try {
      const saved = await updateProfile(values);
      setProfile(saved);
      form.reset(saved);
      addHistoryItem({ kind: 'profile', title: 'Profile updated', detail: 'Saved safety context and demographic data.' });
      toast.success('Profile saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <CardHeader>
            <Badge variant="soft" className="w-fit gap-2 px-3 py-2 text-sm">
              <UserRound className="h-4 w-4" />
              Profile settings
            </Badge>
            <CardTitle className="mt-3 text-4xl">Maintain a clean health profile for better safety checks.</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Save allergies, medications, pregnancy context, and notes. The profile is used by the interaction and pregnancy workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSave)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-age">Age</Label>
                  <Input id="profile-age" type="number" {...form.register('age', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-gender">Gender</Label>
                  <Input id="profile-gender" placeholder="female" {...form.register('gender')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-weight">Weight (kg)</Label>
                  <Input id="profile-weight" type="number" step="0.1" {...form.register('weight_kg', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-medications">Current medications</Label>
                  <Input id="profile-medications" placeholder="Metformin, Vitamin D" {...form.register('current_medications')} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white p-3 text-sm text-slate-700">
                  <Checkbox {...form.register('is_pregnant')} />
                  Pregnant
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white p-3 text-sm text-slate-700">
                  <Checkbox {...form.register('is_lactating')} />
                  Lactating
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-allergies">Allergies</Label>
                <Textarea id="profile-allergies" rows={3} placeholder="Penicillin, peanuts" {...form.register('allergies')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-conditions">Medical conditions</Label>
                <Textarea id="profile-conditions" rows={3} placeholder="Hypertension, diabetes" {...form.register('medical_conditions')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-notes">Notes</Label>
                <Textarea id="profile-notes" rows={4} placeholder="Additional context for medicine safety checks" {...form.register('notes')} />
              </div>

              <Button type="submit" className="w-full">
                <CheckCircle2 className="h-4 w-4" />
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current snapshot</CardTitle>
            <CardDescription>What the backend will use when the profile-aware checks run.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {profile ? (
                [
                  { label: 'Age', value: profile.age ?? 'Not set' },
                  { label: 'Gender', value: profile.gender ?? 'Not set' },
                  { label: 'Pregnant', value: profile.is_pregnant ? 'Yes' : 'No' },
                  { label: 'Lactating', value: profile.is_lactating ? 'Yes' : 'No' },
                  { label: 'Allergies', value: profile.allergies ?? 'None listed' },
                  { label: 'Conditions', value: profile.medical_conditions ?? 'None listed' },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border/70 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 p-8 text-center">
                  <p className="text-base font-semibold text-slate-950">No profile saved yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Fill out the form to unlock profile-aware safety warnings.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}