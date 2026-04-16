import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import "./App.css";

import type {
  PortInfo, SerialConfig, ModbusResponse, MonitorPair,
  ConnMode, WorkMode, RegisterMap, ByteOrder,
} from "./types";
import { FUNCTION_CODES } from "./constants";
import { formatHex, fcName } from "./utils";

import ConnectionSection from "./components/ConnectionSection";
import QuerySection from "./components/QuerySection";
import RegisterMapEditor from "./components/RegisterMapEditor";
import AiSection from "./components/AiSection";
import FilterToolbar from "./components/FilterToolbar";
import PacketList from "./components/PacketList";
import DetailPanel from "./components/DetailPanel";

function App() {
  const [mode, setMode] = useState<ConnMode>("RTU");
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [serialConfig, setSerialConfig] = useState<SerialConfig>({
    baud_rate: 9600, data_bits: 8, parity: "None", stop_bits: 1,
  });
  const [tcpIp, setTcpIp] = useState("192.168.1.1");
  const [tcpPort, setTcpPort] = useState(502);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const [slaveId, setSlaveId] = useState(1);
  const [functionCode, setFunctionCode] = useState(0x03);
  const [startAddress, setStartAddress] = useState(0);
  const [quantity, setQuantity] = useState(10);
  const [writeValue, setWriteValue] = useState("0");
  const [sending, setSending] = useState(false);
  const [autoQuery, setAutoQuery] = useState(false);
  const [autoInterval, setAutoInterval] = useState(1000);
  const [workMode, setWorkMode] = useState<WorkMode>("query");
  const [monitoring, setMonitoring] = useState(false);
  const [monitorPairs, setMonitorPairs] = useState<MonitorPair[]>([]);
  const [regMaps, setRegMaps] = useState<RegisterMap[]>([]);
  const [byteOrder, setByteOrder] = useState<ByteOrder>("AB");
  const [aiConfig, setAiConfig] = useState({ api_url: "", api_key: "", model: "" });
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [transactions, setTransactions] = useState<ModbusResponse[]>([]);
  const [selectedTx, setSelectedTx] = useState<ModbusResponse | null>(null);
  const [filterText, setFilterText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);
  const sendRef = useRef<() => void>(() => {});

  const fcType = FUNCTION_CODES.find((f) => f.code === functionCode)?.type ?? "read";

  const filteredTransactions = transactions.filter((tx) => {
    if (!filterText) return true;
    const q = filterText.trim().toLowerCase();
    if (String(tx.slave_id) === q) return true;
    if (fcName(tx.function_code).toLowerCase().includes(q)) return true;
    if (("0x" + tx.function_code.toString(16)) === q) return true;
    if (formatHex(tx.raw_request).toLowerCase().includes(q)) return true;
    if (formatHex(tx.raw_response).toLowerCase().includes(q)) return true;
    if (tx.exception_text?.toLowerCase().includes(q)) return true;
    return false;
  });

  const filteredMonitorPairs = monitorPairs.filter((pair) => {
    if (!filterText) return true;
    const q = filterText.trim().toLowerCase();
    const frame = pair.response ?? pair.request;
    if (!frame) return false;
    if (String(frame.slave_id) === q) return true;
    if (fcName(frame.function_code).toLowerCase().includes(q)) return true;
    if (("0x" + frame.function_code.toString(16)) === q) return true;
    return false;
  });

  const refreshPorts = useCallback(async () => {
    try {
      const result = await invoke<PortInfo[]>("list_ports");
      setPorts(result);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => { refreshPorts(); }, [refreshPorts]);

  useEffect(() => {
    invoke<RegisterMap[]>("load_register_map").then(setRegMaps).catch(() => {});
    invoke<{ api_url: string; api_key: string; model: string }>("load_ai_config").then(setAiConfig).catch(() => {});
    invoke<{ mode: string; port_name: string; baud_rate: number; data_bits: number; parity: string; stop_bits: number; tcp_ip: string; tcp_port: number }>("load_connection_config").then((cfg) => {
      setMode(cfg.mode as ConnMode);
      setSelectedPort(cfg.port_name);
      setSerialConfig({ baud_rate: cfg.baud_rate, data_bits: cfg.data_bits, parity: cfg.parity, stop_bits: cfg.stop_bits });
      setTcpIp(cfg.tcp_ip);
      setTcpPort(cfg.tcp_port);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    if (monitoring) {
      listen<MonitorPair>("monitor-frame", (event) => {
        setMonitorPairs((prev) => {
          const next = [...prev, event.payload];
          return next.length > 10000 ? next.slice(next.length - 10000) : next;
        });
      }).then((fn) => { unlisten = fn; });
    }
    return () => { if (unlisten) unlisten(); };
  }, [monitoring]);

  useEffect(() => {
    if (autoScroll.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [transactions]);

  useEffect(() => { sendRef.current = handleSend; });
  useEffect(() => {
    if (!autoQuery || !connected || workMode !== "query") return;
    const id = setInterval(() => sendRef.current(), autoInterval);
    return () => clearInterval(id);
  }, [autoQuery, autoInterval, connected, workMode]);

  const handleConnect = async () => {
    try {
      if (mode === "RTU") {
        await invoke("connect_port", { portName: selectedPort, config: serialConfig });
      } else {
        await invoke("connect_tcp", { config: { ip: tcpIp, port: tcpPort } });
      }
      setConnected(true);
      setError("");
      invoke("save_connection_config", {
        config: {
          mode, port_name: selectedPort,
          baud_rate: serialConfig.baud_rate, data_bits: serialConfig.data_bits,
          parity: serialConfig.parity, stop_bits: serialConfig.stop_bits,
          tcp_ip: tcpIp, tcp_port: tcpPort,
        },
      }).catch(() => {});
    } catch (e) {
      setError(String(e));
    }
  };

  const handleDisconnect = async () => {
    try {
      await invoke("disconnect");
      setConnected(false);
      setAutoQuery(false);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  };

  const handleSend = async () => {
    if (!connected || sending) return;
    if (slaveId < 1 || slaveId > 247) { setError("从站地址无效，有效范围 1-247"); return; }
    if (startAddress < 0 || startAddress > 65535) { setError("起始地址无效，有效范围 0x0000-0xFFFF"); return; }
    if (fcType === "read" && (quantity < 1 || quantity > 2000)) { setError("读取数量无效，有效范围 1-2000"); return; }
    if (fcType === "write-single") {
      const v = parseInt(writeValue, 10);
      if (isNaN(v)) { setError("写入值必须是数字"); return; }
      if (functionCode === 0x06 && (v < 0 || v > 65535)) { setError("寄存器值无效，有效范围 0-65535"); return; }
    }
    if (fcType === "write-multiple") {
      const vals = writeValue.split(/[,\s]+/).filter(Boolean);
      if (vals.length === 0) { setError("写多个值时至少提供一个值"); return; }
      for (const s of vals) { if (isNaN(parseInt(s, 10))) { setError('写入值 "' + s + '" 不是有效数字'); return; } }
    }
    setSending(true);
    setError("");
    try {
      let writeValues: number[] | undefined;
      if (fcType === "write-single") {
        writeValues = [parseInt(writeValue, 10) || 0];
      } else if (fcType === "write-multiple") {
        writeValues = writeValue.split(/[,\s]+/).filter(Boolean).map((v) => parseInt(v, 10) || 0);
      }
      const resp = await invoke<ModbusResponse>("modbus_query", {
        request: {
          slave_id: slaveId, function_code: functionCode, start_address: startAddress,
          quantity: fcType === "write-multiple" ? (writeValues?.length ?? quantity) : quantity,
          write_values: writeValues,
        },
      });
      setTransactions((prev) => {
        const next = [...prev, resp];
        return next.length > 10000 ? next.slice(next.length - 10000) : next;
      });
    } catch (e) {
      const msg = String(e);
      setError(msg);
      if (msg.includes("[E2001]") || msg.includes("[E3001]") || msg.includes("[E3004]") || msg.includes("连接可能已断开")) {
        setConnected(false);
        setAutoQuery(false);
      }
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => { setTransactions([]); setMonitorPairs([]); setSelectedTx(null); };

  const handleStartMonitor = async () => {
    if (!connected || mode !== "RTU") { setError("被动监听仅支持 RTU 串口模式"); return; }
    try {
      await invoke("start_monitor", { baudRate: serialConfig.baud_rate });
      setMonitoring(true);
      setError("");
    } catch (e) { setError(String(e)); }
  };
  const handleStopMonitor = async () => {
    try {
      await invoke("stop_monitor");
      setMonitoring(false);
      setConnected(false);
      setError("");
    } catch (e) { setError(String(e)); }
  };

  const handleAiAnalyze = async () => {
    if (!aiConfig.api_url || !aiConfig.api_key) { setError("请先配置 AI API 地址和密钥"); return; }
    const data = workMode === "monitor" ? monitorPairs : transactions;
    if (data.length === 0) { setError("没有可分析的通信记录"); return; }
    setAiLoading(true);
    setAiResult("");
    try {
      const result = await invoke<string>("ai_analyze", { config: aiConfig, context: JSON.stringify(data.slice(-50), null, 1) });
      setAiResult(result);
    } catch (e) { setError(String(e)); }
    finally { setAiLoading(false); }
  };

  const handleSaveAiConfig = () => {
    invoke("save_ai_config", { config: aiConfig }).then(() => setError("")).catch((e) => setError(String(e)));
  };

  const handleExport = async (format: "csv" | "json") => {
    const isMonitor = workMode === "monitor";
    const hasData = isMonitor ? monitorPairs.length > 0 : transactions.length > 0;
    if (!hasData) { setError("没有可导出的记录"); return; }
    let content: string;
    if (format === "csv") {
      if (isMonitor) {
        const header = "序号,时间,从站,功能码,配对,异常,数据,请求HEX,响应HEX,校验,耗时ms";
        const rows = monitorPairs.map((pair, i) => {
          const frame = pair.response ?? pair.request;
          if (!frame) return "";
          const fc = "0x" + frame.function_code.toString(16).toUpperCase().padStart(2, "0");
          const crcOk = (pair.request?.crc_ok ?? true) && (pair.response?.crc_ok ?? true);
          const exc = frame.is_exception ? (frame.exception_code + " " + frame.exception_text) : "";
          const reqHex = pair.request ? formatHex(pair.request.raw) : "";
          const resHex = pair.response ? formatHex(pair.response.raw) : "";
          return (i + 1) + ',"' + frame.ts + '",' + frame.slave_id + ',' + fc + ',' + (pair.request && pair.response ? "是" : "否") + ',"' + exc + '","' + frame.data.join(";") + '","' + reqHex + '","' + resHex + '",' + (crcOk ? "OK" : "FAIL") + ',' + pair.elapsed_ms;
        });
        content = "\uFEFF" + header + "\n" + rows.join("\n");
      } else {
        const header = "序号,时间,模式,从站,功能码,异常,数据,请求HEX,响应HEX,校验,耗时ms";
        const rows = transactions.map((tx, i) => {
          const fc = "0x" + tx.function_code.toString(16).toUpperCase().padStart(2, "0");
          const exc = tx.is_exception ? (tx.exception_code + " " + tx.exception_text) : "";
          return (i + 1) + ',"' + tx.ts + '",' + tx.mode + ',' + tx.slave_id + ',' + fc + ',"' + exc + '","' + tx.data.join(";") + '","' + formatHex(tx.raw_request) + '","' + formatHex(tx.raw_response) + '",' + (tx.crc_ok ? "OK" : "FAIL") + ',' + tx.elapsed_ms;
        });
        content = "\uFEFF" + header + "\n" + rows.join("\n");
      }
    } else {
      content = JSON.stringify(isMonitor ? monitorPairs : transactions, null, 2);
    }
    try {
      const path = await invoke<string>("export_log", { content, format });
      setError("");
      alert("已导出到: " + path);
    } catch (e) {
      const msg = String(e);
      if (!msg.includes("[E6003]")) setError(msg);
    }
  };

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    autoScroll.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  const canConnect = mode === "RTU" ? !!selectedPort : (!!tcpIp && tcpPort > 0);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>myModbus</h1>
          <span className="version">v0.1.0</span>
        </div>

        <ConnectionSection
          mode={mode} setMode={setMode} ports={ports} selectedPort={selectedPort}
          setSelectedPort={setSelectedPort} serialConfig={serialConfig} setSerialConfig={setSerialConfig}
          tcpIp={tcpIp} setTcpIp={setTcpIp} tcpPort={tcpPort} setTcpPort={setTcpPort}
          connected={connected} canConnect={canConnect}
          onConnect={handleConnect} onDisconnect={handleDisconnect} onRefreshPorts={refreshPorts}
        />

        {connected && mode === "RTU" && (
          <div className="sidebar-section">
            <div className="section-title">工作模式</div>
            <div className="mode-tabs">
              <button className={`mode-tab ${workMode === "query" ? "active" : ""}`} onClick={() => { if (!monitoring) setWorkMode("query"); }} disabled={monitoring}>查询</button>
              <button className={`mode-tab ${workMode === "monitor" ? "active" : ""}`} onClick={() => { if (!monitoring) setWorkMode("monitor"); }} disabled={monitoring}>监听</button>
            </div>
            {workMode === "monitor" && (
              monitoring ? (
                <button className="btn-action btn-disconnect" onClick={handleStopMonitor}>停止监听</button>
              ) : (
                <button className="btn-action btn-connect" onClick={handleStartMonitor}>开始监听</button>
              )
            )}
          </div>
        )}

        {workMode === "query" && (
          <QuerySection
            slaveId={slaveId} setSlaveId={setSlaveId}
            functionCode={functionCode} setFunctionCode={setFunctionCode}
            startAddress={startAddress} setStartAddress={setStartAddress}
            quantity={quantity} setQuantity={setQuantity}
            writeValue={writeValue} setWriteValue={setWriteValue}
            sending={sending} connected={connected}
            autoQuery={autoQuery} setAutoQuery={setAutoQuery}
            autoInterval={autoInterval} setAutoInterval={setAutoInterval}
            onSend={handleSend}
          />
        )}

        <div className="sidebar-section">
          <div className="section-title">状态</div>
          <div className="status-info">
            <div className="status-row">
              <span className="status-label">连接</span>
              <span className={connected ? "status-dot connected" : "status-dot"}>
                {connected ? "已连接 (" + mode + ")" : "未连接"}
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">事务数</span>
              <span className="status-value mono">{workMode === "monitor" ? monitorPairs.length : transactions.length}</span>
            </div>
            {monitoring && (
              <div className="status-row">
                <span className="status-label">监听</span>
                <span className="status-dot connected">运行中</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="sidebar-section">
            <div className="error-box">{error}</div>
          </div>
        )}

        <RegisterMapEditor regMaps={regMaps} setRegMaps={setRegMaps} setError={setError} />

        <AiSection
          aiConfig={aiConfig} setAiConfig={setAiConfig} aiLoading={aiLoading}
          onSaveConfig={handleSaveAiConfig} onAnalyze={handleAiAnalyze}
        />
      </aside>

      <main className="main">
        <FilterToolbar
          workMode={workMode} monitoring={monitoring}
          filterText={filterText} setFilterText={setFilterText}
          transactionCount={transactions.length} monitorCount={monitorPairs.length}
          aiResult={aiResult} onExport={handleExport} onClear={handleClear}
          onCloseAi={() => setAiResult("")}
        />

        <div className="main-content">
          <PacketList
            workMode={workMode}
            filteredTransactions={filteredTransactions}
            filteredMonitorPairs={filteredMonitorPairs}
            selectedTx={selectedTx} onSelectTx={setSelectedTx}
            monitoring={monitoring} connected={connected}
            listRef={listRef} onScroll={handleScroll}
          />

          {selectedTx && (
            <DetailPanel
              selectedTx={selectedTx} onClose={() => setSelectedTx(null)}
              byteOrder={byteOrder} setByteOrder={setByteOrder}
              startAddress={startAddress} regMaps={regMaps}
            />
          )}

          {aiResult && (
            <div className="detail-panel">
              <div className="detail-header">
                <span>AI 分析结果</span>
                <button className="btn-icon-sm" onClick={() => setAiResult("")} title="关闭">×</button>
              </div>
              <div className="detail-body">
                <div className="ai-result">{aiResult}</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
