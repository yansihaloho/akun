import type { AccountStatsByStatusItem } from './accountStatsByStatusItem';

export interface AccountStats {
  total: number;
  facebook: number;
  instagram: number;
  byStatus: AccountStatsByStatusItem[];
}
