import type { ModbusResponse, RegisterMap, ByteOrder } from "../types";
import { BYTE_ORDERS } from "../constants";
import { formatHex, fcName, copyToClipboard, applyByteOrder, formatAddr } from "../utils";

interface Props {
  selectedTx: ModbusResponse;
  onClose: () => void;
  byteOrder: ByteOrder;
  setByteOrder: (o: ByteOrder) => void;
  startAddress: number;
  regMaps: RegisterMap[];
}

export default function DetailPanel({ selectedTx, onClose, byteOrder, setByteOrder, startAddress, regMaps }: Props) {
  const getRegName = (addr: number) => regMaps.find((r) => r.address === addr);

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <span>报文详情 ({selectedTx.mode})</span>
        <button className="btn-icon-sm" onClick={onClose} title="关闭">×</button>
      </div>
      <div className="detail-body">
        <div className="detail-section">
          <div className="detail-label" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>请求 (TX)</span>
            <button className="btn-icon-sm" onClick={() => copyToClipboard(formatHex(selectedTx.raw_request))} title="复制">⧉</button>
          </div>
          <div className="detail-hex mono">{formatHex(selectedTx.raw_request)}</div>
        </div>
        <div className="detail-section">
          <div className="detail-label" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>响应 (RX)</span>
            <button className="btn-icon-sm" onClick={() => copyToClipboard(formatHex(selectedTx.raw_response))} title="复制">⧉</button>
          </div>
          <div className={`detail-hex mono ${!selectedTx.crc_ok ? "hex-error" : ""}`}>
            {formatHex(selectedTx.raw_response)}
          </div>
        </div>
        <div className="detail-section">
          <div className="detail-label">解析</div>
          <div className="detail-grid">
            <span className="detail-key">通信模式</span>
            <span className="detail-val">{selectedTx.mode === "RTU" ? "Modbus RTU (串口)" : "Modbus TCP"}</span>
            <span className="detail-key">从站地址</span>
            <span className="detail-val mono">{selectedTx.slave_id}</span>
            <span className="detail-key">功能码</span>
            <span className="detail-val">{fcName(selectedTx.function_code)}</span>
            <span className="detail-key">{selectedTx.mode === "RTU" ? "CRC 校验" : "MBAP 校验"}</span>
            <span className={`detail-val ${selectedTx.crc_ok ? "text-ok" : "text-err"}`}>
              {selectedTx.crc_ok ? "通过" : "失败"}
            </span>
            <span className="detail-key">响应耗时</span>
            <span className="detail-val mono">{selectedTx.elapsed_ms} ms</span>
            {selectedTx.is_exception && (
              <>
                <span className="detail-key">异常码</span>
                <span className="detail-val text-err">
                  0x{selectedTx.exception_code?.toString(16).toUpperCase().padStart(2, "0")} {selectedTx.exception_text}
                </span>
              </>
            )}
          </div>
        </div>
        {!selectedTx.is_exception && selectedTx.data.length > 0 && (
          <div className="detail-section">
            <div className="detail-label" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>寄存器值</span>
              <select className="byte-order-select" value={byteOrder} onChange={(e) => setByteOrder(e.target.value as ByteOrder)}>
                {BYTE_ORDERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="register-table">
              <table>
                <thead>
                  <tr><th>地址</th><th>名称</th><th>十进制</th><th>十六进制</th></tr>
                </thead>
                <tbody>
                  {applyByteOrder(selectedTx.data, byteOrder).map((val, idx) => {
                    const is32 = byteOrder.length === 4;
                    const addr = startAddress + (is32 ? idx * 2 : idx);
                    const reg = getRegName(addr);
                    const scaled = reg && reg.scale !== 1 ? (val * reg.scale).toFixed(2) : val;
                    const hexWidth = is32 ? 8 : 4;
                    return (
                      <tr key={idx}>
                        <td className="mono">{formatAddr(addr)}</td>
                        <td>{reg ? `${reg.name}${reg.unit ? ` (${reg.unit})` : ""}` : ""}</td>
                        <td className="mono">{scaled}</td>
                        <td className="mono">0x{(val >>> 0).toString(16).toUpperCase().padStart(hexWidth, "0")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
