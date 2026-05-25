import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CopyPlus, Search, ShieldCheck, AlertCircle, Heart, Pill } from 'lucide-react';
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
    if (error) return 'Search failed. Please try again.';
    if (query.trim().length < 2) return 'Enter a medicine name to check interactions, precautions, and safety information.';
    if (!items.length && !isLoading) return 'No medicines found. Try a different name or check the spelling.';
    return '';
  }, [error, isLoading, items.length, query]);

  const exampleMedicines = ['Paracetamol', 'Aspirin', 'Dolo 650', 'Metformin'];

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
    <div className="space-y-6">
      <section>
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 shadow-[0_8px_24px_rgba(20,184,166,0.08)]">
          <CardHeader className="pb-4">
            <Badge variant="soft" className="w-fit gap-2 px-3 py-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Safety-first medicine search
            </Badge>
            <CardTitle className="mt-3 text-3xl font-bold leading-tight">Check medicine details, interactions, and precautions</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 mt-2">
              Access verified medicine data to check safety profiles, allergic reactions, drug interactions, pregnancy precautions, and detailed dosage guidance.
            </CardDescription>

            {/* Trust Indicators */}
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-slate-700">Interaction Safety</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-slate-700">Allergy Aware</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs">
                <Heart className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-slate-700">Pregnancy Safe</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs">
                <Pill className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-slate-700">Verified Data</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <form className="space-y-3" onSubmit={form.handleSubmit(() => undefined)}>
              <div className="relative group">
                <Input
                  placeholder="Search medicine by generic name, brand name, or strength..."
                  className="border-teal-200/60 bg-white/80 placeholder:text-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-200 py-4 text-base shadow-sm group-focus-within:shadow-md transition-shadow"
                  {...form.register('query')}
                />
              </div>
              <div className="flex gap-2 sm:flex-row flex-col">
                <Button
                  type="submit"
                  className="flex-1 sm:flex-initial sm:min-w-44 bg-teal-600 hover:bg-teal-700 text-white py-4 text-base font-semibold rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? 'Searching...' : 'Check Medicine'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 font-medium">Type at least 2 characters for instant search • No account required</p>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-700">Medicine Results</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {total
                ? total === 1
                  ? '1 medicine found'
                  : `${total} medicines found`
                : 'Search results appear here'}
            </h2>
            {total > 0 && <p className="mt-1.5 text-xs text-slate-600">Click on any result to view detailed information</p>}
          </div>
          <Badge variant="outline" className="hidden px-3 py-2 text-xs sm:inline-flex">
            <CopyPlus className="h-4 w-4" />
            Verified data
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((medicine) => (
              <Card
                key={medicine.id}
                className="group h-full cursor-pointer border-slate-200/60 bg-white/90 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
                onClick={() => openMedicine(medicine)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold text-slate-950 truncate group-hover:text-teal-600 transition-colors">
                        {medicine.generic_name}
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-xs font-medium text-slate-600 truncate">
                        {medicine.brand_name ? `Brand: ${medicine.brand_name}` : 'Generic medicine'}
                      </CardDescription>
                    </div>
                    <Badge variant="soft" className="ml-2 shrink-0 text-xs font-semibold">
                      {medicine.source_name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pb-3">
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-700">
                    {stripHtml(
                      medicine.composition || medicine.usage_guidelines || medicine.side_effects || 'Detailed medicine information available'
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {medicine.dosage_form && <Badge variant="outline" className="text-xs">{medicine.dosage_form}</Badge>}
                    {medicine.strength && <Badge variant="outline" className="text-xs">{medicine.strength}</Badge>}
                    {medicine.aliases.slice(0, 1).map((alias) => (
                      <Badge key={alias.id} variant="secondary" className="text-xs">
                        {alias.alias}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <div className="border-t border-slate-100 bg-gradient-to-r from-teal-50/30 to-cyan-50/30 px-3 py-2">
                  <p className="text-xs font-medium text-teal-700">Click for details & interactions</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <Search className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-950">{emptyState}</h3>
            {query.trim().length < 2 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium text-slate-700">Try searching for:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {exampleMedicines.map((medicine) => (
                    <button
                      key={medicine}
                      onClick={() => form.setValue('query', medicine)}
                      className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs text-teal-700 hover:bg-teal-50 transition-colors"
                    >
                      {medicine}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {query.trim().length >= 2 && (
              <p className="mt-2 text-xs text-slate-600">Try a different medicine name, brand name, or check the spelling</p>
            )}
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
              {/* Key Info Grid */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Generic Name</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{selectedMedicine.generic_name}</p>
                </div>
                <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Brand Name</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{selectedMedicine.brand_name ?? '—'}</p>
                </div>
                <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Data Confidence</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{Math.round(selectedMedicine.confidence * 100)}%</p>
                </div>
                <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Verified Source</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{selectedMedicine.source_name}</p>
                </div>
              </div>

              {/* Composition & Usage */}
              <Card className="border-slate-200/60 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Composition & Dosage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-950">Composition</p>
                    <p className="mt-1 text-slate-700">{selectedMedicine.composition ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Dosage Form</p>
                    <p className="mt-1 text-slate-700">{selectedMedicine.dosage_form ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Strength</p>
                    <p className="mt-1 text-slate-700">{selectedMedicine.strength ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Usage Guidelines</p>
                    <p className="mt-1 text-slate-700">{selectedMedicine.usage_guidelines ?? '—'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Safety & Risk Information */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-rose-200/50 bg-gradient-to-br from-rose-50/50 to-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <AlertCircle className="h-5 w-5 text-rose-600" />
                      Safety Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold text-slate-950">Side Effects</p>
                      <p className="mt-1 text-slate-700">{selectedMedicine.side_effects ?? 'No known side effects listed'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Precautions</p>
                      <p className="mt-1 text-slate-700">{selectedMedicine.precautions ?? 'No precautions listed'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Contraindications</p>
                      <p className="mt-1 text-slate-700">{selectedMedicine.contraindications ?? 'No contraindications listed'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/60 bg-white/90 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <Pill className="h-5 w-5 text-teal-600" />
                      Brand Conversion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {selectedMedicine.brand_name ? (
                      <div className="rounded-lg bg-teal-50 p-3">
                        <p className="text-xs font-semibold uppercase text-teal-700">Mapping</p>
                        <p className="mt-2 text-slate-900">
                          <span className="font-semibold">{selectedMedicine.brand_name}</span> (brand) →{' '}
                          <span className="font-semibold">{selectedMedicine.generic_name}</span> (generic)
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-600">No brand-to-generic mapping available for this medicine.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Aliases & Sources */}
              <Card className="border-slate-200/60 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Alternative Names & Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 mb-2">Also Known As</p>
                    {selectedMedicine.aliases.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedMedicine.aliases.map((alias) => (
                          <Badge key={alias.id} variant="secondary">
                            {alias.alias}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">No aliases recorded</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 mb-2">Data Sources</p>
                    <div className="space-y-2">
                      {selectedMedicine.sources.map((source) => (
                        <div key={source.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="font-semibold text-slate-900 text-sm">{source.source_name}</p>
                          {source.source_url && <p className="mt-1 text-xs text-slate-600 break-all">{source.source_url}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}