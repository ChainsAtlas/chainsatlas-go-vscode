import { HistoryRow } from "../types";

class History {
  public rows: HistoryRow[] = [];

  constructor() {}

  public addRow(row: HistoryRow): void {
    this.rows.unshift(row);
  }

  public clear() {
    this.rows = [];
  }
}

export default History;
