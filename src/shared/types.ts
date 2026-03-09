export type PersonPriority = 'priority' | 'normal';

export type QueueStage = 'reception' | 'baia' | 'dp' | 'completed';

export interface Person {
  id: number;
  name: string;
  rg: string;
  is_pregnant: number; // SQLite boolean (0/1)
  has_infant: number; // SQLite boolean (0/1)
  priority: PersonPriority;
  ticket_reception: string; // R001, R002, etc.
  ticket_dp: string | null; // DP001, DP002, etc.
  stage: QueueStage;
  assigned_baia: number | null;
  check_in_time: string;
  called_reception_at: string | null;
  called_dp_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueueStats {
  total_waiting_reception: number;
  total_in_baia: number;
  total_waiting_dp: number;
  priority_waiting: number;
  normal_waiting: number;
  average_wait_minutes: number;
  normal_served_since_last_priority: number;
}

export const PRIORITY_LABELS: Record<PersonPriority, string> = {
  priority: 'Prioritário',
  normal: 'Normal'
};

export const STAGE_LABELS: Record<QueueStage, string> = {
  reception: 'Aguardando Recepção',
  baia: 'Em Atendimento na Baia',
  dp: 'Aguardando DP',
  completed: 'Atendimento Concluído'
};

export const BAIA_COUNT = 5; // Number of service booths
