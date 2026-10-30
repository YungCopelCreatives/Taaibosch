import React, { useEffect, useMemo, useState } from 'react';
import { Star, Check, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { Button, Card, Empty, PageHeader, Segmented, Spinner, useNotify } from '../ui';
import { PRODUCTS } from '../../data/products';
import type { AdminReview } from '../../types';

export const Reviews: React.FC = () => {
  const notify = useNotify();
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [view, setView] = useState('pending');

  useEffect(() => { api('reviews').then(d => setReviews(d.reviews)).catch(e => notify(e.message, 'error')); }, []);

  const list = useMemo(() => (reviews ?? []).filter(r => view === 'all' || (view === 'pending' ? !r.approved : r.approved)), [reviews, view]);
  const productName = (id: string) => PRODUCTS.find(p => p.id === id)?.name ?? 'Unknown product';

  const setApproved = async (r: AdminReview, approved: boolean) => {
    await api(`reviews/${r.id}`, { method: 'PATCH', body: { approved } });
    setReviews(rs => rs!.map(x => (x.id === r.id ? { ...x, approved } : x)));
    notify(approved ? 'Review published' : 'Review hidden');
  };
  const remove = async (r: AdminReview) => {
    if (!confirm('Delete this review permanently?')) return;
    await api(`reviews/${r.id}`, { method: 'DELETE' });
    setReviews(rs => rs!.filter(x => x.id !== r.id));
    notify('Review deleted');
  };

  const pending = reviews?.filter(r => !r.approved).length ?? 0;

  return (
    <div>
      <PageHeader title="Reviews" subtitle="New customer reviews wait here until someone approves them." />
      <div className="mb-4">
        <Segmented value={view} onChange={setView} options={[{ value: 'pending', label: 'Waiting', count: pending }, { value: 'approved', label: 'Published' }, { value: 'all', label: 'All' }]} />
      </div>
      {!reviews ? <Spinner /> : list.length === 0 ? (
        <Card><Empty icon={MessageSquare} title={view === 'pending' ? 'All caught up' : 'No reviews here yet'} text={view === 'pending' ? 'There are no reviews waiting for approval.' : undefined} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(r => (
            <Card key={r.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.userName}</p>
                  <p className="text-xs text-brand-ink/40">{productName(r.productId)} · {r.date}</p>
                </div>
                <span className="flex text-yellow-500" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} className={i < r.rating ? '' : 'text-brand-ink/10'} />)}
                </span>
              </div>
              <p className="text-sm text-brand-ink/70 leading-relaxed">"{r.comment}"</p>
              <div className="flex gap-2 pt-1">
                {r.approved ? (
                  <Button variant="secondary" size="sm" onClick={() => setApproved(r, false)}><EyeOff size={14} /> Hide</Button>
                ) : (
                  <Button size="sm" onClick={() => setApproved(r, true)}><Check size={14} /> Approve</Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => remove(r)}><Trash2 size={14} /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
