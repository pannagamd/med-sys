import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CopyPlus, Search, Sparkles, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/services/api/client';
import { searchMedicines, getMedicine } from '@/services/api/medicines';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { addHistoryItem } from '@/lib/history';
import { stripHtml } from '@/lib/utils';
import type { Medicine } from '@/types/api';

const searchSchema = z.object({ query: z.string().min(2, 'Enter at least 2 characters') });
type SearchValues = z.infer<typeof searchSchema>;

export function MedicineSearchPage() {
  const form = useForm<SearchValues>({ resolver: zodResolver(searchSchema), defaultValues: { query: '' } });
  const query = form.watch('query');
  const debouncedQuery = useDebouncedValue(query, 350);
  const [items, setItems] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const queryText = debouncedQuery.trim();

    async function runSearch() {
      if (queryText.length < 2) {
        setItems([]);
        setTotal(0);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await searchMedicines(queryText, 12, 0);
        setItems(response.items);
        setTotal(response.total);
        addHistoryItem({ kind: 'medicine', title: `Medicine search: ${queryText}`, detail: `${response.total} results returned for ${queryText}` });
      } catch (searchError) {
        setError(getApiErrorMessage(searchError));
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    runSearch();
  }, [debouncedQuery]);

  const emptyState = useMemo(() => {
    if (error) return 'Search failed. Try again or refine the query.';
    if (query.trim().length < 2) return 'Search by generic name, brand name, or composition.';
    if (!items.length && !isLoading) return 'No medicines matched your query.';
    return '';
  }, [error, isLoading, items.length, query]);

  async function openMedicine(medicine: Medicine) {
    setSelectedMedicine(medicine);
    setDetailLoading(true);
    try {
      const full = await getMedicine(medicine.id);
      setSelectedMedicine(full);
      addHistoryItem({ kind: 'medicine', title: `Viewed medicine: ${full.generic_name}`, detail: full.brand_name ? `Brand conversion available for ${full.brand_name}` : 'Opened medicine details' });
    } catch (medicineError) {
      toast.error(getApiErrorMessage(medicineError));
    } finally {
      setDetailLoading(false);
    }
  }

  const brandGenericHint = selectedMedicine?.brand_name && selectedMedicine.generic_name
    ? `${selectedMedicine.brand_name} maps to ${selectedMedicine.generic_name}`
    : 'Brand-to-generic guidance appears here when a branded product is available.';

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <CardHeader>
            <Badge variant="soft" className="w-fit gap-2 px-3 py-2 text-sm">
              <Search className="h-4 w-4" />
              Live medicine search
            </Badge>
            <CardTitle className="mt-3 text-4xl">Find medicine records with a fast, polished search flow.</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Search local medicine data, then open rich detail cards for brand conversion, precautions, dosage guidance, and source metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={form.handleSubmit(() => undefined)}>
              <Input placeholder="Search generic or brand names" {...form.register('query')} />
              <Button type="submit" className="sm:min-w-36" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-3 text-sm text-muted-foreground">Type at least two characters to start the live query.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search tips</CardTitle>
            <CardDescription>Live search is debounced to keep the UI responsive on mobile and desktop.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              'Use brand names to see the generic mapping.',
              'Open a result for dosage, precautions, and contraindications.',
              'Build on search history from the dashboard overview.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-4 text-sm leading-6 text-slate-700">
                <div className="mt-1 rounded-full bg-teal-50 p-1.5 text-teal-700">
                  <WandSparkles className="h-3.5 w-3.5" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">Results</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">{total ? `${total} results found` : 'Search results will appear here'}</h2>
          </div>
          <Badge variant="outline" className="hidden px-3 py-2 text-sm sm:inline-flex">
            <CopyPlus className="h-4 w-4" />
            Local medicine data
          </Badge>
        </div>

        {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">{error}</div> : null}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((medicine) => (
              <Card key={medicine.id} className="h-full cursor-pointer border-white/70 bg-white/85 transition hover:-translate-y-1 hover:shadow-xl" onClick={() => openMedicine(medicine)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{medicine.generic_name}</CardTitle>
                      <CardDescription className="mt-2 text-base">{medicine.brand_name ?? 'Brand name not listed'}</CardDescription>
                    </div>
                    <Badge variant={medicine.brand_name ? 'soft' : 'outline'}>{medicine.source_name}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{stripHtml(medicine.composition ?? medicine.usage_guidelines ?? medicine.side_effects ?? 'No additional record details available.')}</p>
                  <div className="flex flex-wrap gap-2">
                    {medicine.dosage_form ? <Badge variant="outline">{medicine.dosage_form}</Badge> : null}
                    {medicine.strength ? <Badge variant="outline">{medicine.strength}</Badge> : null}
                    {medicine.aliases.slice(0, 2).map((alias) => (
                      <Badge key={alias.id} variant="secondary">
                        {alias.alias}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/80 bg-white/70 p-10 text-center">
            <p className="text-lg font-semibold text-slate-950">{emptyState}</p>
            <p className="mt-2 text-sm text-muted-foreground">{query.trim().length < 2 ? 'Search a medicine to see live results.' : 'Try a broader brand or generic term.'}</p>
          </div>
        )}
      </section>

      <Dialog open={Boolean(selectedMedicine)} onOpenChange={(open) => !open && setSelectedMedicine(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMedicine?.generic_name}</DialogTitle>
            <DialogDescription>{brandGenericHint}</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : selectedMedicine ? (
            <div className="space-y-6 py-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-teal-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Brand</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedMedicine.brand_name ?? 'None listed'}</p>
                </div>
                <div className="rounded-2xl bg-teal-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Generic</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedMedicine.generic_name}</p>
                </div>
                <div className="rounded-2xl bg-teal-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Confidence</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{Math.round(selectedMedicine.confidence * 100)}%</p>
                </div>
                <div className="rounded-2xl bg-teal-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Source</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedMedicine.source_name}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border/70 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-xl">Usage and composition</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                    <p><span className="font-semibold text-slate-900">Composition:</span> {selectedMedicine.composition ?? 'Not listed'}</p>
                    <p><span className="font-semibold text-slate-900">Dosage form:</span> {selectedMedicine.dosage_form ?? 'Not listed'}</p>
                    <p><span className="font-semibold text-slate-900">Strength:</span> {selectedMedicine.strength ?? 'Not listed'}</p>
                    <p><span className="font-semibold text-slate-900">Usage guidance:</span> {selectedMedicine.usage_guidelines ?? 'No usage guidance stored.'}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/70 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-xl">Risk notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                    <p><span className="font-semibold text-slate-900">Side effects:</span> {selectedMedicine.side_effects ?? 'Not listed'}</p>
                    <p><span className="font-semibold text-slate-900">Precautions:</span> {selectedMedicine.precautions ?? 'Not listed'}</p>
                    <p><span className="font-semibold text-slate-900">Contraindications:</span> {selectedMedicine.contraindications ?? 'Not listed'}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border/70 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-xl">Brand to generic conversion</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-7 text-muted-foreground">
                    {selectedMedicine.brand_name ? (
                      <p>
                        <span className="font-semibold text-slate-900">{selectedMedicine.brand_name}</span> maps to{' '}
                        <span className="font-semibold text-slate-900">{selectedMedicine.generic_name}</span>.
                      </p>
                    ) : (
                      <p>No branded mapping is stored for this record.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/70 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-xl">Aliases and sources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
                      {selectedMedicine.aliases.length ? selectedMedicine.aliases.map((alias) => <Badge key={alias.id} variant="secondary">{alias.alias}</Badge>) : <span>None stored.</span>}
                    </div>
                    <div className="space-y-2">
                      {selectedMedicine.sources.map((source) => (
                        <div key={source.id} className="rounded-2xl bg-teal-50/70 p-3 text-slate-700">
                          <p className="font-semibold text-slate-900">{source.source_name}</p>
                          <p>{source.source_url ?? 'Source metadata not available'}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}