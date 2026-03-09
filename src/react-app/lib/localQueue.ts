import type { Person, QueueStats } from '@/shared/types';

interface QueueStore {
  persons: Person[];
  settings: {
    normal_served_count: number;
    ticket_counter_R: number;
    ticket_counter_DP: number;
  };
}

interface LastCalled {
  reception: (Person & { called_for: string })[];
  dp: (Person & { called_for: string })[];
}

const STORAGE_KEY = 'idealqueue_local_db';
const BAIA_COUNT = 5;

function now() {
  return new Date().toISOString();
}

function defaultStore(): QueueStore {
  return {
    persons: [],
    settings: {
      normal_served_count: 0,
      ticket_counter_R: 0,
      ticket_counter_DP: 0,
    },
  };
}

function readStore(): QueueStore {
  if (typeof window === 'undefined') return defaultStore();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultStore();
  try {
    const parsed = JSON.parse(raw) as QueueStore;
    return {
      persons: parsed.persons ?? [],
      settings: {
        normal_served_count: parsed.settings?.normal_served_count ?? 0,
        ticket_counter_R: parsed.settings?.ticket_counter_R ?? 0,
        ticket_counter_DP: parsed.settings?.ticket_counter_DP ?? 0,
      },
    };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: QueueStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function sortReception(persons: Person[]) {
  return [...persons].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'priority' ? -1 : 1;
    return new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime();
  });
}

function sortDp(persons: Person[]) {
  return [...persons].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'priority' ? -1 : 1;
    return new Date(a.called_reception_at || a.check_in_time).getTime() - new Date(b.called_reception_at || b.check_in_time).getTime();
  });
}

function computeStats(store: QueueStore): QueueStats {
  const reception = store.persons.filter((p) => p.stage === 'reception');
  const baia = store.persons.filter((p) => p.stage === 'baia');
  const dp = store.persons.filter((p) => p.stage === 'dp');

  const waitedMinutes = reception.concat(baia, dp).map((p) => {
    const end = p.called_reception_at ? new Date(p.called_reception_at).getTime() : Date.now();
    const start = new Date(p.check_in_time).getTime();
    return Math.max(0, Math.round((end - start) / 60000));
  });

  const avg = waitedMinutes.length
    ? Math.round(waitedMinutes.reduce((sum, n) => sum + n, 0) / waitedMinutes.length)
    : 0;

  return {
    total_waiting_reception: reception.length,
    total_in_baia: baia.length,
    total_waiting_dp: dp.length,
    priority_waiting: reception.filter((p) => p.priority === 'priority').length,
    normal_waiting: reception.filter((p) => p.priority === 'normal').length,
    average_wait_minutes: avg,
    normal_served_since_last_priority: store.settings.normal_served_count,
  };
}

function availableBaiasFromStore(store: QueueStore): number[] {
  const occupied = new Set(
    store.persons.filter((p) => p.stage === 'baia' && p.assigned_baia != null).map((p) => p.assigned_baia as number),
  );
  const available: number[] = [];
  for (let i = 1; i <= BAIA_COUNT; i += 1) {
    if (!occupied.has(i)) available.push(i);
  }
  return available;
}

function getNextForReception(store: QueueStore): Person | null {
  const priorityPerson = sortReception(store.persons.filter((p) => p.stage === 'reception' && p.priority === 'priority'))[0];
  const normalPerson = sortReception(store.persons.filter((p) => p.stage === 'reception' && p.priority === 'normal'))[0];

  if (store.settings.normal_served_count >= 3 && priorityPerson) return priorityPerson;
  if (normalPerson) return normalPerson;
  if (priorityPerson) return priorityPerson;
  return null;
}

export const localQueueApi = {
  isEnabled() {
    return typeof window !== 'undefined';
  },

  getReception() {
    return sortReception(readStore().persons.filter((p) => p.stage === 'reception'));
  },

  getBaia() {
    return [...readStore().persons.filter((p) => p.stage === 'baia')].sort(
      (a, b) => (a.assigned_baia || 0) - (b.assigned_baia || 0),
    );
  },

  getDp() {
    return sortDp(readStore().persons.filter((p) => p.stage === 'dp'));
  },

  getStats() {
    return computeStats(readStore());
  },

  getBaias() {
    const store = readStore();
    const available = availableBaiasFromStore(store);
    const occupied = Array.from({ length: BAIA_COUNT }, (_, idx) => idx + 1).filter((n) => !available.includes(n));
    return { available, occupied };
  },

  getLastCalled(): LastCalled {
    const store = readStore();
    const reception = [...store.persons]
      .filter((p) => p.called_reception_at && p.stage === 'baia')
      .sort((a, b) => new Date(b.called_reception_at || '').getTime() - new Date(a.called_reception_at || '').getTime())
      .slice(0, 3)
      .map((p) => ({ ...p, called_for: 'reception' }));

    const dp = [...store.persons]
      .filter((p) => p.called_dp_at && p.stage === 'dp')
      .sort((a, b) => new Date(b.called_dp_at || '').getTime() - new Date(a.called_dp_at || '').getTime())
      .slice(0, 3)
      .map((p) => ({ ...p, called_for: 'dp' }));

    return { reception, dp };
  },

  addPerson(data: { name: string; rg: string; is_pregnant: boolean; has_infant: boolean }) {
    const store = readStore();
    store.settings.ticket_counter_R += 1;
    const id = store.persons.length ? Math.max(...store.persons.map((p) => p.id)) + 1 : 1;
    const ts = now();
    const person: Person = {
      id,
      name: data.name,
      rg: data.rg,
      is_pregnant: data.is_pregnant ? 1 : 0,
      has_infant: data.has_infant ? 1 : 0,
      priority: data.is_pregnant || data.has_infant ? 'priority' : 'normal',
      ticket_reception: `R${String(store.settings.ticket_counter_R).padStart(3, '0')}`,
      ticket_dp: null,
      stage: 'reception',
      assigned_baia: null,
      check_in_time: ts,
      called_reception_at: null,
      called_dp_at: null,
      completed_at: null,
      created_at: ts,
      updated_at: ts,
    };
    store.persons.push(person);
    writeStore(store);
    return person;
  },

  callForReception(baia: number) {
    const store = readStore();
    if (!availableBaiasFromStore(store).includes(baia)) {
      throw new Error('Baia já está ocupada');
    }

    const person = getNextForReception(store);
    if (!person) {
      throw new Error('Nenhuma pessoa na fila');
    }

    const target = store.persons.find((p) => p.id === person.id)!;
    target.stage = 'baia';
    target.assigned_baia = baia;
    target.called_reception_at = now();
    target.updated_at = now();

    if (target.priority === 'priority') {
      store.settings.normal_served_count = 0;
    } else {
      store.settings.normal_served_count += 1;
    }

    writeStore(store);
    return target;
  },

  completeBaia(id: number) {
    const store = readStore();
    const person = store.persons.find((p) => p.id === id && p.stage === 'baia');
    if (!person) throw new Error('Pessoa não encontrada ou não está em baia');

    store.settings.ticket_counter_DP += 1;
    person.stage = 'dp';
    person.ticket_dp = `DP${String(store.settings.ticket_counter_DP).padStart(3, '0')}`;
    person.assigned_baia = null;
    person.updated_at = now();
    writeStore(store);
    return person;
  },

  callForDP() {
    const store = readStore();
    const person = sortDp(store.persons.filter((p) => p.stage === 'dp'))[0];
    if (!person) throw new Error('Nenhuma pessoa aguardando DP');
    const target = store.persons.find((p) => p.id === person.id)!;
    target.called_dp_at = now();
    target.updated_at = now();
    writeStore(store);
    return target;
  },

  completeDP(id: number) {
    const store = readStore();
    const person = store.persons.find((p) => p.id === id);
    if (!person) throw new Error('Pessoa não encontrada');
    person.stage = 'completed';
    person.completed_at = now();
    person.updated_at = now();
    writeStore(store);
    return { success: true };
  },

  resetQueue() {
    const store = readStore();
    const ts = now();
    store.persons.forEach((p) => {
      if (p.stage !== 'completed') {
        p.stage = 'completed';
        p.completed_at = ts;
        p.updated_at = ts;
      }
    });
    store.settings.normal_served_count = 0;
    store.settings.ticket_counter_R = 0;
    store.settings.ticket_counter_DP = 0;
    writeStore(store);
    return { success: true };
  },
};
