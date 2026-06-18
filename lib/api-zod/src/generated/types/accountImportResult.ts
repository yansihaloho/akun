import type { AccountImportResultErrorsItem } from './accountImportResultErrorsItem';

export interface AccountImportResult {
  imported: number;
  failed: number;
  total: number;
  errors?: AccountImportResultErrorsItem[];
}
