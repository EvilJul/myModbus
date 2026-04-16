import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { RegisterMap } from "../types";
import { formatAddr } from "../utils";

interface Props {
  regMaps: RegisterMap[];
  setRegMaps: (maps: RegisterMap[]) => void;
  setError: (msg: string) => void;
}

export default function RegisterMapEditor({ regMaps, setRegMaps, setError }: Props) {
  const [showEditor, setShowEditor] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [addr, setAddr] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [scale, setScale] = useState("1");

  const handleAdd = () => {
    const a = parseInt(addr || "0", 16);
    if (isNaN(a) || a < 0 || a > 65535) { setError("寄存器地址无效，有效范围 0x0000-0xFFFF"); return; }
    if (!name.trim()) { setError("请输入寄存器名称"); return; }
    const s = parseFloat(scale) || 1;
    const updated = [...regMaps.filter((r) => r.address !== a), { address: a, name: name.trim(), unit: unit.trim(), scale: s }];
    updated.sort((x, y) => x.address - y.address);
    setRegMaps(updated);
    invoke("save_register_map", { maps: updated }).catch((e) => setError(String(e)));
    setAddr(""); setName(""); setUnit(""); setScale("1"); setShowForm(false);
  };

  const handleRemove = (address: number) => {
    const updated = regMaps.filter((r) => r.address !== address);
    setRegMaps(updated);
    invoke("save_register_map", { maps: updated }).catch((e) => setError(String(e)));
  };

  const resetForm = () => { setShowForm(false); setAddr(""); setName(""); setUnit(""); setScale("1"); };

  return (
    <div className="sidebar-section">
      <div className="section-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>寄存器映射 ({regMaps.length})</span>
        <button className="btn-icon-sm" onClick={() => setShowEditor(!showEditor)} title="展开/收起">{showEditor ? "−" : "+"}</button>
      </div>
      {showEditor && (
        <>
          <div className="reg-map-list">
            {regMaps.map((r) => (
              <div key={r.address} className="reg-map-item">
                <span className="mono">{formatAddr(r.address)}</span>
                <span>{r.name}{r.unit ? ` (${r.unit})` : ""}{r.scale !== 1 ? ` ×${r.scale}` : ""}</span>
                <button className="btn-icon-sm" onClick={() => handleRemove(r.address)} title="删除">×</button>
              </div>
            ))}
          </div>
          <button className="btn-action btn-connect" onClick={() => setShowForm(true)} style={{marginTop:4}}>添加映射</button>
          {showForm && (
            <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:6}}>
              <div className="field">
                <label>地址 (Hex)</label>
                <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="3000" />
              </div>
              <div className="field">
                <label>名称</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="温度" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>单位</label>
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="°C" />
                </div>
                <div className="field">
                  <label>缩放</label>
                  <input type="text" value={scale} onChange={(e) => setScale(e.target.value)} placeholder="1" />
                </div>
              </div>
              <div style={{display:"flex", gap:6}}>
                <button className="btn-action btn-connect" onClick={handleAdd} style={{flex:1}}>确认</button>
                <button className="btn-action btn-disconnect" onClick={resetForm} style={{flex:1}}>取消</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
