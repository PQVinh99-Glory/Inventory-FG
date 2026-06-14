export interface InventoryRow {
  lp_no: string;
  feature: string;
  qty: number;
  warehouse: string;
  create_date: string;
  stock_in_date: string;
  tag_id: string;
  bin: string;
  inventory_id: string;
}

export interface SummaryAnalysisRow {
  feature: string;
  actual: number;
  iscala: number;
  diff: number;
  diff_percent: number;
}

export interface HangPhuKienRow {
  id: string;
  code: string;
  qty: number;
  bin: string;
  created_at?: string;
  updated_at?: string;
}

export interface KpiState {
  totalActual: number;
  diff: number;
  diffPercent: string;
  noData: number;
  move: number;
  duplicates: number;
}

export interface AnalysisState {
  noData: string[];
  lowStock: { feat: string; kien: string }[];
  duplicates: string[];
  midStock: { feat: string; kien: string }[];
}
