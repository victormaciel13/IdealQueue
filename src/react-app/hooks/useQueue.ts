import { useState, useEffect, useCallback } from 'react';
import type { Person, QueueStats } from '@/shared/types';
import { localQueueApi } from '@/react-app/lib/localQueue';

const API_BASE = '/api/queue';

export function useQueue() {
  const [receptionQueue, setReceptionQueue] = useState<Person[]>([]);
  const [baiaQueue, setBaiaQueue] = useState<Person[]>([]);
  const [dpQueue, setDpQueue] = useState<Person[]>([]);
  const [availableBaias, setAvailableBaias] = useState<number[]>([1, 2, 3, 4, 5]);
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
  const [error, setError] = useState<string | null>(null);
  const [useLocalMode, setUseLocalMode] = useState(false);

  const loadLocalData = useCallback(() => {
    setReceptionQueue(localQueueApi.getReception());
    setBaiaQueue(localQueueApi.getBaia());
    setDpQueue(localQueueApi.getDp());
    setStats(localQueueApi.getStats());
    setAvailableBaias(localQueueApi.getBaias().available);
    setError(null);
  }, []);

  const fetchQueue = useCallback(async () => {
    if (useLocalMode) {
      loadLocalData();
      setLoading(false);
      return;
    }

    try {
      const [receptionRes, baiaRes, dpRes, statsRes, baiasRes] = await Promise.all([
        fetch(`${API_BASE}/reception`),
        fetch(`${API_BASE}/baia`),
        fetch(`${API_BASE}/dp`),
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/baias`)
      ]);

      const responses = [receptionRes, baiaRes, dpRes, statsRes, baiasRes];
      if (responses.some((res) => !res.ok)) {
        throw new Error('API indisponível');
      }

      setReceptionQueue(await receptionRes.json());
      setBaiaQueue(await baiaRes.json());
      setDpQueue(await dpRes.json());
      setStats(await statsRes.json());
      const baiasData = await baiasRes.json();
      setAvailableBaias(baiasData.available);
      setError(null);
    } catch (err) {
      console.warn('API não disponível, usando modo local:', err);
      setUseLocalMode(true);
      loadLocalData();
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [loadLocalData, useLocalMode]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const addPerson = async (data: {
    name: string;
    rg: string;
    is_pregnant: boolean;
    has_infant: boolean;
  }) => {
    try {
      if (useLocalMode) {
        localQueueApi.addPerson(data);
        loadLocalData();
        return true;
      }

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Erro ao adicionar pessoa');

      await fetchQueue();
      return true;
    } catch (err) {
      console.error(err);
      if (!useLocalMode) {
        setUseLocalMode(true);
        localQueueApi.addPerson(data);
        loadLocalData();
        return true;
      }
      setError('Erro ao adicionar pessoa');
      return false;
    }
  };

  const callForReception = async (baia: number) => {
    try {
      if (useLocalMode) {
        const person = localQueueApi.callForReception(baia);
        loadLocalData();
        return person;
      }

      const res = await fetch(`${API_BASE}/call-reception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baia })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao chamar');
        return null;
      }

      const person = await res.json();
      await fetchQueue();
      return person;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao chamar próxima pessoa');
      return null;
    }
  };

  const completeBaia = async (id: number) => {
    try {
      if (useLocalMode) {
        localQueueApi.completeBaia(id);
        loadLocalData();
        return true;
      }

      const res = await fetch(`${API_BASE}/${id}/complete-baia`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Erro ao finalizar baia');

      await fetchQueue();
      return true;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao finalizar atendimento na baia');
      return false;
    }
  };

  const callForDP = async () => {
    try {
      if (useLocalMode) {
        const person = localQueueApi.callForDP();
        loadLocalData();
        return person;
      }

      const res = await fetch(`${API_BASE}/call-dp`, {
        method: 'POST'
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao chamar para DP');
        return null;
      }

      const person = await res.json();
      await fetchQueue();
      return person;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao chamar para DP');
      return null;
    }
  };

  const completeDP = async (id: number) => {
    try {
      if (useLocalMode) {
        localQueueApi.completeDP(id);
        loadLocalData();
        return true;
      }

      const res = await fetch(`${API_BASE}/${id}/complete`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Erro ao finalizar atendimento');

      await fetchQueue();
      return true;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao finalizar atendimento');
      return false;
    }
  };

  const resetQueue = async () => {
    try {
      if (useLocalMode) {
        localQueueApi.resetQueue();
        loadLocalData();
        return true;
      }

      const res = await fetch(`${API_BASE}/reset`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Erro ao resetar fila');

      await fetchQueue();
      return true;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao resetar fila');
      return false;
    }
  };

  return {
    receptionQueue,
    baiaQueue,
    dpQueue,
    availableBaias,
    stats,
    loading,
    error,
    addPerson,
    callForReception,
    completeBaia,
    callForDP,
    completeDP,
    resetQueue,
    refresh: fetchQueue,
    useLocalMode,
  };
}
