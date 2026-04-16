import { useState } from "react";

interface Props {
  aiConfig: { api_url: string; api_key: string; model: string };
  setAiConfig: (c: { api_url: string; api_key: string; model: string }) => void;
  aiLoading: boolean;
  onSaveConfig: () => void;
  onAnalyze: () => void;
}

export default function AiSection({ aiConfig, setAiConfig, aiLoading, onSaveConfig, onAnalyze }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="sidebar-section">
      <div className="section-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>AI 分析</span>
        <button className="btn-icon-sm" onClick={() => setShow(!show)} title="展开/收起">{show ? "−" : "+"}</button>
      </div>
      {show && (
        <>
          <div className="field">
            <label>API 地址</label>
            <input type="text" value={aiConfig.api_url} onChange={(e) => setAiConfig({...aiConfig, api_url: e.target.value})} placeholder="https://api.openai.com/v1/chat/completions" />
          </div>
          <div className="field">
            <label>API Key</label>
            <input type="password" value={aiConfig.api_key} onChange={(e) => setAiConfig({...aiConfig, api_key: e.target.value})} placeholder="sk-..." />
          </div>
          <div className="field">
            <label>模型</label>
            <input type="text" value={aiConfig.model} onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})} placeholder="gpt-4o" />
          </div>
          <div style={{display:"flex",gap:6}}>
            <button className="btn-action btn-connect" onClick={onSaveConfig} style={{flex:1}}>保存配置</button>
            <button className="btn-action btn-send" onClick={onAnalyze} disabled={aiLoading} style={{flex:1}}>
              {aiLoading ? "分析中..." : "分析报文"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
