import { useState, useEffect, useCallback } from 'react';
import type { Person, QueueStats } from '@/shared/types';
import { localQueueApi } from '@/react-app/lib/localQueue';

interface LastCalled {
  reception: (Person & { called_for: string })[];
  dp: (Person & { called_for: string })[];
}

export function useQueueDisplay() {
  const [receptionQueue, setReceptionQueue] = useState<Person[]>([]);
  const [baiaQueue, setBaiaQueue] = useState<Person[]>([]);
  const [dpQueue, setDpQueue] = useState<Person[]>([]);
  const [lastCalled, setLastCalled] = useState<LastCalled>({ reception: [], dp: [] });
  const [stats, setStats] = useState<QueueStats>({
    total_waiting_reception: 0,
    total_in_baia: 0,
    total_waiting_dp: 0,
    priority_waiting: 0,
    normal_waiting: 0,
    average_wait_minutes: 0,
    normal_served_since_last_priority: 0
  });
  const [loading, setLoading] = useState(true);
  const [useLocalMode, setUseLocalMode] = useState(false);

  const loadLocalData = useCallback(() => {
    setReceptionQueue(localQueueApi.getReception());
    setBaiaQueue(localQueueApi.getBaia());
    setDpQueue(localQueueApi.getDp());
    setStats(localQueueApi.getStats());
    setLastCalled(localQueueApi.getLastCalled());
  }, []);

  const fetchData = useCallback(async () => {
    if (useLocalMode) {
      loadLocalData();
      setLoading(false);
      return;
    }

    try {
      const [receptionRes, baiaRes, dpRes, statsRes, lastCalledRes] = await Promise.all([
        fetch('/api/queue/reception'),
        fetch('/api/queue/baia'),
        fetch('/api/queue/dp'),
        fetch('/api/queue/stats'),
        fetch('/api/queue/last-called')
      ]);

      const responses = [receptionRes, baiaRes, dpRes, statsRes, lastCalledRes];
      if (responses.some((res) => !res.ok)) {
        throw new Error('API indisponível');
      }

      setReceptionQueue(await receptionRes.json());
      setBaiaQueue(await baiaRes.json());
      setDpQueue(await dpRes.json());
      setStats(await statsRes.json());
      setLastCalled(await lastCalledRes.json());
    } catch (err) {
      console.warn('API não disponível, usando modo local:', err);
      setUseLocalMode(true);
      loadLocalData();
    } finally {
      setLoading(false);
    }
  }, [loadLocalData, useLocalMode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    receptionQueue,
    baiaQueue,
    dpQueue,
    lastCalled,
    stats,
    loading,
    refresh: fetchData,
    useLocalMode,
  };
}
