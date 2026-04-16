import type { ModbusResponse, MonitorPair, WorkMode } from "../types";
import { formatTimestamp, fcName, formatDataHex } from "../utils";

interface Props {
  workMode: WorkMode;
  filteredTransactions: ModbusResponse[];
  filteredMonitorPairs: MonitorPair[];
  selectedTx: ModbusResponse | null;
  onSelectTx: (tx: ModbusResponse) => void;
  monitoring: boolean;
  connected: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export default function PacketList({
  workMode, filteredTransactions, filteredMonitorPairs,
  selectedTx, onSelectTx, monitoring, connected, listRef, onScroll,
}: Props) {
  return (
    <div className="packet-list" ref={listRef} onScroll={onScroll}>
      <table>
        <thead>
          <tr>
            <th className="col-index">#</th>
            <th className="col-time">时间</th>
            <th className="col-mode">模式</th>
            <th className="col-slave">从站</th>
            <th className="col-fc">功能码</th>
            <th className="col-data">数据</th>
            <th className="col-crc">校验</th>
            <th className="col-ms">耗时</th>
          </tr>
        </thead>
        <tbody>
          {workMode === "query" ? (
            filteredTransactions.map((tx, i) => (
              <tr
                key={i}
                className={`${tx.is_exception ? "row-error" : ""} ${!tx.crc_ok ? "row-crc-error" : ""} ${tx.slow ? "row-slow" : ""} ${selectedTx === tx ? "row-selected" : ""}`}
                onClick={() => onSelectTx(tx)}
              >
                <td className="mono col-index">{i + 1}</td>
                <td className="mono col-time">{formatTimestamp(tx.ts)}</td>
                <td className="col-mode">
                  <span className={`mode-badge mode-${tx.mode.toLowerCase()}`}>{tx.mode}</span>
                </td>
                <td className="mono col-slave">{tx.slave_id}</td>
                <td className="col-fc">
                  <span className={`fc-badge ${tx.is_exception ? "fc-exception" : ""}`}>{fcName(tx.function_code)}</span>
                </td>
                <td className="mono col-data">
                  {tx.is_exception ? tx.exception_text : formatDataHex(tx.data)}
                </td>
                <td className="col-crc">
                  <span className={tx.crc_ok ? "crc-ok" : "crc-fail"}>
                    {tx.crc_ok ? "OK" : "ERR"}
                  </span>
                </td>
                <td className="mono col-ms">{tx.elapsed_ms}ms{tx.slow && " ⚠"}</td>
              </tr>
            ))
          ) : (
            filteredMonitorPairs.map((pair, i) => {
              const frame = pair.response ?? pair.request;
              if (!frame) return null;
              const hasReq = !!pair.request;
              const hasRes = !!pair.response;
              const isExc = frame.is_exception;
              const crcOk = (pair.request?.crc_ok ?? true) && (pair.response?.crc_ok ?? true);
              return (
                <tr key={i} className={`${isExc ? "row-error" : ""} ${!crcOk ? "row-crc-error" : ""}`}>
                  <td className="mono col-index">{i + 1}</td>
                  <td className="mono col-time">{formatTimestamp(frame.ts)}</td>
                  <td className="col-mode">
                    <span className={`mode-badge ${pair.retry_hint ? "mode-tcp" : "mode-rtu"}`}>{hasReq && hasRes ? (pair.retry_hint ? "重试" : "配对") : "孤立"}</span>
                  </td>
                  <td className="mono col-slave">{frame.slave_id}</td>
                  <td className="col-fc">
                    <span className={`fc-badge ${isExc ? "fc-exception" : ""}`}>{fcName(frame.function_code)}</span>
                  </td>
                  <td className="mono col-data">
                    {isExc ? frame.exception_text : formatDataHex(frame.data)}
                  </td>
                  <td className="col-crc">
                    <span className={crcOk ? "crc-ok" : "crc-fail"}>{crcOk ? "OK" : "ERR"}</span>
                  </td>
                  <td className="mono col-ms">{pair.elapsed_ms}ms</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {(workMode === "query" ? filteredTransactions.length : filteredMonitorPairs.length) === 0 && (
        <div className="empty-state">
          <p>{workMode === "monitor"
            ? (monitoring ? "等待总线数据..." : "点击「开始监听」捕获总线报文")
            : (connected ? "配置参数后点击「发送」开始查询" : "连接串口或 TCP 后开始 Modbus 通信")
          }</p>
        </div>
      )}
    </div>
  );
}
