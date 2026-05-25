import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { suggestSymptoms } from '@/services/api/symptoms';
import { getApiErrorMessage } from '@/services/api/client';
import { addHistoryItem } from '@/lib/history';
import { parseListInput } from '@/lib/parsers';
import { severityBadgeVariant } from '@/lib/severity';
import type { SymptomSuggestionResponse } from '@/types/api';

const symptomSchema = z.object({
  symptoms: z.string().min(2, 'Add at least one symptom'),
  existing_conditions: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  current_medications: z.string().optional().nullable(),
  include_saved_profile: z.boolean(),
});

type SymptomValues = z.infer<typeof symptomSchema>;

export function SymptomsPage() {
  const form = useForm<SymptomValues>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      symptoms: 'Headache, fever',
      existing_conditions: '',
      allergies: '',
      current_medications: '',
      include_saved_profile: true,
    },
  });
  const [result, setResult] = useState<SymptomSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSuggest(values: SymptomValues) {
    const symptoms = parseListInput(values.symptoms);
    if (!symptoms.length) {
      toast.error('Enter one or more symptoms.');
      return;
    }

    setLoading(true);
    try {
      const data = await suggestSymptoms({
        symptoms,
        existing_conditions: values.existing_conditions || undefined,
        allergies: values.allergies || undefined,
        current_medications: values.current_medications || undefined,
        include_saved_profile: values.include_saved_profile,
      });
      setResult(data);
      addHistoryItem({ kind: 'symptom', title: `Symptom check: ${symptoms.join(', ')}`, detail: `${data.suggestions.length} suggestion(s) returned` });
      toast.success('Symptom suggestions ready.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <CardHeader>
            <Badge variant="soft" className="w-fit gap-2 px-3 py-2 text-sm">
              <Sparkles className="h-4 w-4" />
              Symptom checker
            </Badge>
            <CardTitle className="mt-3 text-4xl">Start with what you know, then refine the guidance.</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Enter symptoms and context to surface conservative care recommendations, warning triggers, and medicines commonly used for the suggested conditions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSuggest)}>
              <Textarea rows={5} placeholder="Headache, fever, body ache" {...form.register('symptoms')} />
              {form.formState.errors.symptoms ? <p className="text-sm text-rose-600">{form.formState.errors.symptoms.message}</p> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="existing_conditions">Existing conditions</Label>
                  <Input id="existing_conditions" placeholder="Diabetes, hypertension" {...form.register('existing_conditions')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input id="allergies" placeholder="Penicillin" {...form.register('allergies')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_medications">Current medications</Label>
                <Textarea id="current_medications" rows={3} placeholder="Metformin, aspirin" {...form.register('current_medications')} />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white p-3 text-sm text-slate-700">
                <Checkbox {...form.register('include_saved_profile')} />
                Include saved profile context
              </label>

              <Button type="submit" disabled={loading}>
                {loading ? 'Analyzing...' : 'Get symptom suggestions'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What this checks</CardTitle>
            <CardDescription>Rule-based symptom matching with profile warnings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              'Possible conditions based on matched symptoms.',
              'Care recommendations and escalation triggers.',
              'Warnings for current medications and allergies.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border/70 bg-white p-4 text-sm leading-6 text-slate-700">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {result ? (
        <section className="space-y-6">
          {result.urgent ? (
            <Card className="border-rose-200 bg-rose-50/90">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-2xl bg-white p-2 text-rose-700 shadow-sm">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">Urgent attention</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{result.emergency_warning}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {result.suggestions.map((suggestion, index) => (
              <Card key={`${suggestion.possible_condition}-${index}`} className="h-full border-white/70 bg-white/85">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{suggestion.possible_condition}</CardTitle>
                      <CardDescription className="mt-2 text-base">Matched symptoms: {suggestion.matched_symptoms.join(', ')}</CardDescription>
                    </div>
                    <Badge variant={severityBadgeVariant(suggestion.seek_medical_care ? 'dangerous' : suggestion.confidence > 0.7 ? 'safe' : 'moderate')}>
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                  <p><span className="font-semibold text-slate-900">Seek medical care:</span> {suggestion.seek_medical_care ? 'Yes' : 'No'}</p>
                  <div>
                    <p className="font-semibold text-slate-900">Care recommendations</p>
                    <ul className="mt-2 space-y-2">
                      {suggestion.care_recommendations.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Commonly used medicines</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestion.commonly_used_medicines.length ? suggestion.commonly_used_medicines.map((item) => <Badge key={item} variant="outline">{item}</Badge>) : <span>None listed.</span>}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Precautions</p>
                    <ul className="mt-2 space-y-2">
                      {suggestion.precautions.length ? suggestion.precautions.map((item) => <li key={item}>• {item}</li>) : <li>• No precautions provided.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Escalation triggers</p>
                    <ul className="mt-2 space-y-2">
                      {suggestion.escalation_triggers.length ? suggestion.escalation_triggers.map((item) => <li key={item}>• {item}</li>) : <li>• No escalation triggers provided.</li>}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {result.profile_warnings.length ? (
            <Card className="border-amber-200 bg-amber-50/90">
              <CardHeader>
                <CardTitle className="text-amber-900">Profile warnings</CardTitle>
                <CardDescription className="text-amber-800">These warnings are conservative and should be checked against the saved profile.</CardDescription>
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