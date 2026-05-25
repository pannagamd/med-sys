import { useMemo, useState } from 'react';
import { FileClock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clearHistory, readHistory } from '@/lib/history';
import { formatRelativeDate } from '@/lib/utils';
import type { PagedHistoryItem } from '@/types/api';

const filters: Array<'all' | PagedHistoryItem['kind']> = ['all', 'medicine', 'interaction', 'pregnancy', 'profile', 'symptom'];

export function HistoryPage() {
  const [items, setItems] = useState(() => readHistory());
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');

  const filteredItems = useMemo(() => (filter === 'all' ? items : items.filter((item) => item.kind === filter)), [filter, items]);

  function handleClear() {
    clearHistory();
    setItems([]);
    toast.success('History cleared.');
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1fr_auto]">
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <CardHeader>
            <Badge variant="soft" className="w-fit gap-2 px-3 py-2 text-sm">
              <FileClock className="h-4 w-4" />
              Search history
            </Badge>
            <CardTitle className="mt-3 text-4xl">Review recent medicine and safety actions.</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Recent activity is stored locally so the dashboard can surface useful context without introducing unnecessary backend coupling.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Filter or clear the local history state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {filters.map((option) => (
                <Button key={option} variant={filter === option ? 'default' : 'outline'} size="sm" onClick={() => setFilter(option)}>
                  {option}
                </Button>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
              Clear history
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        {filteredItems.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="border-white/70 bg-white/85">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{item.title}</CardTitle>
                      <CardDescription className="mt-2 text-base">{item.detail}</CardDescription>
                    </div>
                    <Badge variant="outline">{item.kind}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{formatRelativeDate(item.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-lg font-semibold text-slate-950">No history available</p>
              <p className="mt-2 text-sm text-muted-foreground">Run a medicine search or interaction check to see entries appear here.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}