import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '@/services';

export const useAnalytics = () => {
  const [overview, setOverview]         = useState(null);
  const [trend, setTrend]               = useState([]);
  const [priority, setPriority]         = useState([]);
  const [category, setCategory]         = useState([]);
  const [productivity, setProductivity] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [trendDays, setTrendDays]       = useState(30);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, tr, pr, cat, prod] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getTrend(trendDays),
        analyticsService.getPriority(),
        analyticsService.getCategory(),
        analyticsService.getProductivity(),
      ]);
      setOverview(ov.data.stats);
      setTrend(tr.data.trend);
      setPriority(pr.data.distribution);
      setCategory(cat.data.breakdown);
      setProductivity(prod.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [trendDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { overview, trend, priority, category, productivity, loading, trendDays, setTrendDays, refetch: fetchAll };
};
