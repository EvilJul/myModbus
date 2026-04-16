import { FUNCTION_CODES } from "../constants";

interface Props {
  slaveId: number;
  setSlaveId: (v: number) => void;
  functionCode: number;
  setFunctionCode: (v: number) => void;
  startAddress: number;
  setStartAddress: (v: number) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  writeValue: string;
  setWriteValue: (v: string) => void;
  sending: boolean;
  connected: boolean;
  autoQuery: boolean;
  setAutoQuery: (v: boolean) => void;
  autoInterval: number;
  setAutoInterval: (v: number) => void;
  onSend: () => void;
}

export default function QuerySection({
  slaveId, setSlaveId, functionCode, setFunctionCode,
  startAddress, setStartAddress, quantity, setQuantity,
  writeValue, setWriteValue, sending, connected,
  autoQuery, setAutoQuery, autoInterval, setAutoInterval, onSend,
}: Props) {
  const fcType = FUNCTION_CODES.find((f) => f.code === functionCode)?.type ?? "read";

  return (
    <div className="sidebar-section">
      <div className="section-title">Modbus 查询</div>
      <div className="field">
        <label>从站地址</label>
        <input type="number" min={1} max={247} value={slaveId} onChange={(e) => setSlaveId(Number(e.target.value))} disabled={!connected} />
      </div>
      <div className="field">
        <label>功能码</label>
        <select value={functionCode} onChange={(e) => setFunctionCode(Number(e.target.value))} disabled={!connected}>
          {FUNCTION_CODES.map((f) => (<option key={f.code} value={f.code}>{f.name}</option>))}
        </select>
      </div>
      <div className="field">
        <label>起始地址(Hex)</label>
        <input type="text" value={startAddress.toString(16).toUpperCase()} onChange={(e) => { const v = parseInt(e.target.value || "0", 16); if (!isNaN(v) && v >= 0 && v <= 65535) setStartAddress(v); }} disabled={!connected} placeholder="3000" />
      </div>
      {fcType === "read" && (
        <div className="field">
          <label>数量</label>
          <input type="number" min={1} max={125} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} disabled={!connected} />
        </div>
      )}
      {fcType === "write-single" && (
        <div className="field">
          <label>{functionCode === 0x05 ? "值 (0=OFF, 1=ON)" : "值"}</label>
          <input type="text" value={writeValue} onChange={(e) => setWriteValue(e.target.value)} disabled={!connected} />
        </div>
      )}
      {fcType === "write-multiple" && (
        <div className="field">
          <label>值 (逗号分隔)</label>
          <input type="text" value={writeValue} onChange={(e) => setWriteValue(e.target.value)} disabled={!connected} placeholder="100, 200, 300" />
        </div>
      )}
      <button className="btn-action btn-send" onClick={onSend} disabled={!connected || sending}>
        {sending ? "发送中..." : "发送"}
      </button>
      <div className={`poll-control ${autoQuery ? "polling" : ""}`}>
        <div className="poll-row">
          <span className="poll-label">
            <span className={`poll-dot ${autoQuery ? "active" : ""}`} />
            自动轮询
          </span>
          <div className="poll-interval">
            <label>间隔</label>
            <select value={autoInterval} onChange={(e) => setAutoInterval(Number(e.target.value))} disabled={autoQuery}>
              <option value={500}>500ms</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
            </select>
          </div>
        </div>
        <button className={`btn-poll ${autoQuery ? "active" : ""}`} onClick={() => setAutoQuery(!autoQuery)} disabled={!connected}>
          {autoQuery ? "停止轮询" : "启动轮询"}
        </button>
      </div>
    </div>
  );
}
