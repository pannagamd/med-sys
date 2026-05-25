import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowRight, ShieldCheck, Stethoscope, Heart, AlertCircle, Activity, Zap, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { suggestSymptoms } from '@/services/api/symptoms';
import { getApiErrorMessage } from '@/services/api/client';
import { addHistoryItem } from '@/lib/history';
import { parseListInput } from '@/lib/parsers';
import { severityBadgeVariant } from '@/lib/severity';
import type { SymptomSuggestionResponse } from '@/types/api';

const symptomSchema = z.object({
  symptoms: z.string().min(2, 'Add at least one symptom'),
});

type SymptomValues = z.infer<typeof symptomSchema>;

const COMMON_SYMPTOMS = ['Headache', 'Fever', 'Cough', 'Sore Throat', 'Body Pain', 'Fatigue', 'Cold', 'Nausea'];

export function SymptomsPage() {
  const form = useForm<SymptomValues>({
    resolver: zodResolver(symptomSchema),
    defaultValues: { symptoms: '' },
  });
  const [result, setResult] = useState<SymptomSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function addSymptomChip(symptom: string) {
    const current = form.getValues('symptoms').trim();
    const updated = current ? `${current}, ${symptom}` : symptom;
    form.setValue('symptoms', updated);
  }

  async function handleSuggest(values: SymptomValues) {
    const symptoms = parseListInput(values.symptoms);
    if (!symptoms.length) {
      toast.error('Enter one or more symptoms.');
      return;
    }

    setLoading(true);
    try {
      // Always use the saved profile — no inline overrides needed now that profile is complete
      const data = await suggestSymptoms({ symptoms, include_saved_profile: true });
      setResult(data);
      addHistoryItem({
        kind: 'symptom',
        title: `Symptom check: ${symptoms.join(', ')}`,
        detail: `${data.suggestions.length} suggestion(s) returned`,
      });
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
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 shadow-[0_8px_24px_rgba(20,184,166,0.08)]">
          <CardHeader>
            <Badge variant="soft" className="w-fit gap-2 px-3 py-2 text-sm">
              <Stethoscope className="h-4 w-4" />
              Guided assessment
            </Badge>
            <CardTitle className="mt-4 text-4xl font-bold leading-tight">
              Start with what you know, then refine the guidance
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 mt-3">
              Describe your symptoms to get personalized care recommendations, medicine suggestions, and warning alerts — powered by your health profile.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Emergency Guidance */}
            <div className="rounded-xl border-l-4 border-l-rose-500 bg-rose-50/80 px-4 py-4">
              <div className="flex gap-3">
                <AlertOctagon className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-rose-900 mb-1">When to seek immediate care:</p>
                  <p className="text-rose-800 text-xs leading-relaxed">
                    Chest pain, severe breathing difficulty, loss of consciousness, severe bleeding, sudden vision changes, or severe allergic reactions require emergency medical attention. Call emergency services immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSuggest)}>
              {/* Quick Symptom Chips */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Quick add symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SYMPTOMS.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => addSymptomChip(symptom)}
                      className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-1"
                    >
                      + {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea with better guidance */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 mb-2 block">
                  Describe your symptoms
                </label>
                <Textarea
                  rows={5}
                  placeholder="Describe symptoms separated by commas. Example: Fever, headache, sore throat"
                  className="border-teal-200/60 bg-white/80 placeholder:text-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-200 py-4 text-base shadow-sm focus:shadow-md transition-shadow"
                  {...form.register('symptoms')}
                />
                {form.formState.errors.symptoms ? (
                  <p className="text-sm text-rose-600 mt-2 font-medium">{form.formState.errors.symptoms.message}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">Separate multiple symptoms with commas or new lines • Be as specific as possible</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5 text-base font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                disabled={loading}
              >
                {loading ? 'Analyzing Your Symptoms...' : 'Analyze Symptoms'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              {/* Medical Disclaimer */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-700">Medical Disclaimer:</span> This tool provides informational guidance only and is not a substitute for professional medical advice. Always consult a qualified healthcare provider for accurate diagnosis and treatment.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* What This Checks Section */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600" />
              How it works
            </CardTitle>
            <CardDescription>This assessment analyzes your symptoms using your health profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-teal-100/50 bg-teal-50/30 p-4 flex gap-3">
              <Heart className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-slate-900">Possible conditions</p>
                <p className="text-slate-600 text-xs mt-1">Matches your symptoms to common conditions</p>
              </div>
            </div>

            <div className="rounded-lg border border-teal-100/50 bg-teal-50/30 p-4 flex gap-3">
              <Zap className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-slate-900">Care recommendations</p>
                <p className="text-slate-600 text-xs mt-1">Personalized guidance and escalation alerts</p>
              </div>
            </div>

            <div className="rounded-lg border border-teal-100/50 bg-teal-50/30 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-slate-900">Profile warnings</p>
                <p className="text-slate-600 text-xs mt-1">Alerts based on allergies, conditions, medicines</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50/60 px-3 py-2.5 text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-700" />
              <span className="text-teal-800 font-medium">Profile automatically applied</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {result ? (
        <section className="space-y-6">
          {result.urgent ? (
            <Card className="border-l-4 border-l-rose-500 border-rose-200 bg-gradient-to-br from-rose-50 to-rose-50/50 shadow-sm">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-full bg-rose-100 p-3 text-rose-700 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold uppercase tracking-[0.28em] text-rose-700 mb-1">
                    Urgent attention required
                  </p>
                  <p className="text-base font-semibold text-slate-950 leading-relaxed">{result.emergency_warning}</p>
                  <p className="text-xs text-rose-800 mt-3 font-medium">If experiencing these symptoms, seek medical attention immediately.</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-2 mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-600">Possible conditions</p>
            <p className="text-sm text-slate-600">Based on your symptoms and health profile</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.suggestions.map((suggestion, index) => (
              <Card
                key={`${suggestion.possible_condition}-${index}`}
                className="group h-full border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold text-slate-950 group-hover:text-teal-600 transition-colors">
                        {suggestion.possible_condition}
                      </CardTitle>
                      <CardDescription className="mt-1.5 text-sm text-slate-600">
                        <span className="font-semibold">Matched:</span> {suggestion.matched_symptoms.join(', ')}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={severityBadgeVariant(
                        suggestion.seek_medical_care
                          ? 'dangerous'
                          : suggestion.confidence > 0.7
                          ? 'safe'
                          : 'moderate',
                      )}
                      className="shrink-0 ml-2"
                    >
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-sm pb-4">
                  {/* Seek Medical Care */}
                  <div className="rounded-lg bg-slate-50/70 border border-slate-200/60 p-3">
                    <p className="font-semibold text-slate-900 text-xs mb-1">Medical Attention</p>
                    <p className="text-slate-700 font-medium">
                      {suggestion.seek_medical_care ? '🔴 Seek medical care' : '🟢 Self-manage or monitor'}
                    </p>
                  </div>

                  {/* Care Recommendations */}
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">Recommendations</p>
                    <ul className="space-y-2">
                      {suggestion.care_recommendations.map((item) => (
                        <li key={item} className="flex gap-2 text-slate-700">
                          <span className="text-teal-600 font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Medicines */}
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">Common medicines</p>
                    {suggestion.commonly_used_medicines.length ? (
                      <div className="flex flex-wrap gap-2">
                        {suggestion.commonly_used_medicines.map((item) => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-xs italic">—</p>
                    )}
                  </div>

                  {/* Precautions */}
                  <div className="border-t border-slate-200/60 pt-3">
                    <p className="font-semibold text-slate-900 mb-2">Precautions</p>
                    <ul className="space-y-2">
                      {suggestion.precautions.length ? (
                        suggestion.precautions.map((item) => (
                          <li key={item} className="flex gap-2 text-slate-700 text-xs">
                            <span className="text-amber-600 font-bold mt-0.5">⚠</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-slate-600 text-xs">No precautions provided.</p>
                      )}
                    </ul>
                  </div>

                  {/* Escalation Triggers */}
                  <div className="border-t border-slate-200/60 pt-3">
                    <p className="font-semibold text-slate-900 mb-2">When to escalate</p>
                    <ul className="space-y-2">
                      {suggestion.escalation_triggers.length ? (
                        suggestion.escalation_triggers.map((item) => (
                          <li key={item} className="flex gap-2 text-slate-700 text-xs">
                            <span className="text-rose-600 font-bold mt-0.5">→</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-slate-600 text-xs">No escalation triggers.</p>
                      )}
                    </ul>
                  </div>
                </CardContent>

                <div className="border-t border-slate-100 bg-gradient-to-r from-teal-50/30 to-cyan-50/30 px-4 py-3">
                  <p className="text-xs font-medium text-teal-700">Confidence score reflects match strength</p>
                </div>
              </Card>
            ))}
          </div>

          {result.profile_warnings.length ? (
            <Card className="border-l-4 border-l-amber-500 border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-50/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <CardTitle className="text-lg text-amber-950">Profile Warnings</CardTitle>
                    <CardDescription className="text-amber-800 text-xs mt-0.5">
                      Based on your allergies, conditions, and medications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {result.profile_warnings.map((warning, index) => (
                  <div
                    key={`${warning.message}-${index}`}
                    className="rounded-lg border border-amber-200/60 bg-white p-4 text-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant={severityBadgeVariant(warning.severity)} className="shrink-0 mt-0.5 text-xs">
                        {warning.severity.toUpperCase()}
                      </Badge>
                      <p className="text-amber-900 leading-relaxed flex-1">{warning.message}</p>
                    </div>
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