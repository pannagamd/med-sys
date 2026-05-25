import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowRight, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { analyzeInteractions } from '@/services/api/interactions';
import { getApiErrorMessage } from '@/services/api/client';
import { addHistoryItem } from '@/lib/history';
import { parseListInput } from '@/lib/parsers';
import { severityBadgeVariant, severityLabel, severityTone } from '@/lib/severity';
import type { InteractionAnalyzeResponse, Severity } from '@/types/api';

const interactionSchema = z.object({ medicines: z.string().min(3, 'Add at least two medicines') });
type InteractionValues = z.infer<typeof interactionSchema>;

export function InteractionsPage() {
  const form = useForm<InteractionValues>({ resolver: zodResolver(interactionSchema), defaultValues: { medicines: 'Aspirin, Warfarin' } });
  const [result, setResult] = useState<InteractionAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const medicines = form.watch('medicines');
  const medicineCount = useMemo(() => parseListInput(medicines).length, [medicines]);

  async function handleCheck(values: InteractionValues) {
    const medicines = parseListInput(values.medicines);
    if (medicines.length < 2) {
      toast.error('Enter at least two medicines separated by commas or new lines.');
      return;
    }

    setLoading(true);
    try {
      const data = await analyzeInteractions(medicines, true);
      setResult(data);
      addHistoryItem({ kind: 'interaction', title: `Interaction check: ${medicines.join(' + ')}`, detail: `Overall severity: ${data.overall_severity}` });
      toast.success('Interaction analysis complete.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const bannerTone = result ? severityTone(result.overall_severity) : 'text-slate-700 bg-slate-50 border-slate-200';

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <CardHeader>
            <Badge variant="soft" className="w-fit gap-2 px-3 py-2 text-sm">
              <ShieldAlert className="h-4 w-4" />
              Drug interaction checker
            </Badge>
            <CardTitle className="mt-3 text-4xl">Compare medicines and surface structured severity guidance.</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Submit multiple medicines, then review each pair with evidence-backed explanations, confidence, and recommended actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleCheck)}>
              <Textarea placeholder="Aspirin, Warfarin, Metformin" rows={5} {...form.register('medicines')} />
              {form.formState.errors.medicines ? <p className="text-sm text-rose-600">{form.formState.errors.medicines.message}</p> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{medicineCount} medicine(s) detected.</p>
                <Button type="submit" disabled={loading} className="sm:min-w-44">
                  {loading ? 'Analyzing...' : 'Analyze interactions'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How the checker works</CardTitle>
            <CardDescription>The UI mirrors the backend response: resolved medicines, pairwise results, and profile warnings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              'Pair each medicine against every other selected medicine.',
              'Highlight overall severity using a color-coded banner.',
              'Surface profile warnings so users review the full context.',
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
          <Card className={`border ${bannerTone}`}>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em]">Overall severity</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{severityLabel(result.overall_severity)}</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">Use this as a screening result and confirm with a licensed clinician when the output is moderate or higher.</p>
              </div>
              <Badge variant={severityBadgeVariant(result.overall_severity)} className="w-fit px-4 py-2 text-sm">
                <Sparkles className="h-4 w-4" />
                {result.overall_severity}
              </Badge>
            </CardContent>
          </Card>

          {result.profile_warnings.length ? (
            <Card className="border-amber-200 bg-amber-50/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="h-5 w-5" />
                  Profile warnings
                </CardTitle>
                <CardDescription className="text-amber-800">These warnings come from the current user profile and should be reviewed before taking medicine.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {result.profile_warnings.map((warning, index) => (
                  <div key={`${warning.message}-${index}`} className="rounded-2xl border border-amber-200 bg-white p-4 text-sm leading-6 text-amber-900">
                    <p className="font-semibold uppercase tracking-[0.24em]">{warning.severity}</p>
                    <p className="mt-1">{warning.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {result.results.map((item, index) => (
              <Card key={`${item.drug_a}-${item.drug_b}-${index}`} className="h-full border-white/70 bg-white/85">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{item.drug_a} + {item.drug_b}</CardTitle>
                      <CardDescription className="mt-2 text-base">{item.explanation}</CardDescription>
                    </div>
                    <Badge variant={severityBadgeVariant(item.severity)}>{item.severity}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                  <p><span className="font-semibold text-slate-900">Mechanism:</span> {item.mechanism ?? 'Not listed'}</p>
                  <p><span className="font-semibold text-slate-900">Confidence:</span> {Math.round(item.confidence * 100)}%</p>
                  <div>
                    <p className="font-semibold text-slate-900">Recommendations</p>
                    <ul className="mt-2 space-y-2">
                      {item.recommendations.length ? item.recommendations.map((recommendation) => <li key={recommendation}>• {recommendation}</li>) : <li>• No additional recommendations available.</li>}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.sources.map((source, sourceIndex) => (
                      <Badge key={`${source.name}-${sourceIndex}`} variant="outline">
                        {source.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resolved medicines</CardTitle>
              <CardDescription>These are the backend-resolved records mapped from the entered medicine names.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {result.resolved_medicines.map((medicine) => (
                  <div key={medicine.input} className="rounded-3xl border border-border/70 bg-white p-4 text-sm leading-6 text-slate-700">
                    <p className="font-semibold text-slate-950">{medicine.input}</p>
                    <p className="mt-1">Resolved as {medicine.resolved_name}</p>
                    <p className="mt-1 text-muted-foreground">{medicine.matched ? 'Matched locally' : 'Resolution is approximate'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}