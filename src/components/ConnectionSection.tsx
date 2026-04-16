import type { PortInfo, SerialConfig, ConnMode } from "../types";
import { BAUD_RATES, DATA_BITS, PARITIES, STOP_BITS } from "../constants";

interface Props {
  mode: ConnMode;
  setMode: (m: ConnMode) => void;
  ports: PortInfo[];
  selectedPort: string;
  setSelectedPort: (p: string) => void;
  serialConfig: SerialConfig;
  setSerialConfig: (c: SerialConfig) => void;
  tcpIp: string;
  setTcpIp: (ip: string) => void;
  tcpPort: number;
  setTcpPort: (p: number) => void;
  connected: boolean;
  canConnect: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefreshPorts: () => void;
}

export default function ConnectionSection({
  mode, setMode, ports, selectedPort, setSelectedPort,
  serialConfig, setSerialConfig, tcpIp, setTcpIp, tcpPort, setTcpPort,
  connected, canConnect, onConnect, onDisconnect, onRefreshPorts,
}: Props) {
  return (
    <div className="sidebar-section">
      <div className="section-title">连接</div>
      <div className="mode-tabs">
        <button className={`mode-tab ${mode === "RTU" ? "active" : ""}`} onClick={() => { if (!connected) setMode("RTU"); }} disabled={connected}>RTU</button>
        <button className={`mode-tab ${mode === "TCP" ? "active" : ""}`} onClick={() => { if (!connected) setMode("TCP"); }} disabled={connected}>TCP</button>
      </div>

      {mode === "RTU" ? (
        <>
          <div className="field">
            <label>串口</label>
            <div className="port-row">
              <select value={selectedPort} onChange={(e) => setSelectedPort(e.target.value)} disabled={connected}>
                <option value="">选择串口...</option>
                {ports.map((p) => (
                  <option key={p.name} value={p.name}>{p.name} ({p.port_type})</option>
                ))}
              </select>
              <button className="btn-icon" onClick={onRefreshPorts} disabled={connected} title="刷新">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="field">
            <label>波特率</label>
            <select value={serialConfig.baud_rate} onChange={(e) => setSerialConfig({ ...serialConfig, baud_rate: Number(e.target.value) })} disabled={connected}>
              {BAUD_RATES.map((b) => (<option key={b} value={b}>{b}</option>))}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>数据位</label>
              <select value={serialConfig.data_bits} onChange={(e) => setSerialConfig({ ...serialConfig, data_bits: Number(e.target.value) })} disabled={connected}>
                {DATA_BITS.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <div className="field">
              <label>停止位</label>
              <select value={serialConfig.stop_bits} onChange={(e) => setSerialConfig({ ...serialConfig, stop_bits: Number(e.target.value) })} disabled={connected}>
                {STOP_BITS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>校验位</label>
            <select value={serialConfig.parity} onChange={(e) => setSerialConfig({ ...serialConfig, parity: e.target.value })} disabled={connected}>
              {PARITIES.map((p) => (<option key={p} value={p}>{p === "None" ? "无" : p === "Even" ? "偶校验" : "奇校验"}</option>))}
            </select>
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <label>IP 地址</label>
            <input type="text" value={tcpIp} onChange={(e) => setTcpIp(e.target.value)} disabled={connected} placeholder="192.168.1.1" />
          </div>
          <div className="field">
            <label>端口</label>
            <input type="number" min={1} max={65535} value={tcpPort} onChange={(e) => setTcpPort(Number(e.target.value))} disabled={connected} />
          </div>
        </>
      )}

      {connected ? (
        <button className="btn-action btn-disconnect" onClick={onDisconnect}>断开连接</button>
      ) : (
        <button className="btn-action btn-connect" onClick={onConnect} disabled={!canConnect}>连接</button>
      )}
    </div>
  );
}
