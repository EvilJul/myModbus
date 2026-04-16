import type { WorkMode } from "../types";

interface Props {
  workMode: WorkMode;
  monitoring: boolean;
  filterText: string;
  setFilterText: (v: string) => void;
  transactionCount: number;
  monitorCount: number;
  aiResult: string;
  onExport: (format: "csv" | "json") => void;
  onClear: () => void;
  onCloseAi: () => void;
}

export default function FilterToolbar({
  workMode, monitoring, filterText, setFilterText,
  transactionCount, monitorCount, aiResult,
  onExport, onClear, onCloseAi,
}: Props) {
  const hasData = workMode === "monitor" ? monitorCount > 0 : transactionCount > 0;

  return (
    <div className="main-toolbar">
      <span className="main-title">{workMode === "monitor" ? "监听记录" : "通信记录"}{monitoring && " (实时)"}</span>
      <input
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="搜索: 从站ID / 功能码 / HEX..."
        style={{flex:"0 1 220px", padding:"4px 10px", border:"1px solid var(--border)", borderRadius:5, background:"var(--bg-base)", color:"var(--text-primary)", fontSize:12, outline:"none"}}
      />
      <div className="main-actions">
        <button className="btn-text" onClick={() => onExport("csv")} disabled={!hasData}>导出 CSV</button>
        <button className="btn-text" onClick={() => onExport("json")} disabled={!hasData}>导出 JSON</button>
        <button className="btn-text" onClick={onClear}>清空</button>
        {aiResult && <button className="btn-text" onClick={onCloseAi}>关闭AI结果</button>}
      </div>
    </div>
  );
}
