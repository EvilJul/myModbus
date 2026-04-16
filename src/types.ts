export interface PortInfo {
  name: string;
  port_type: string;
}

export interface SerialConfig {
  baud_rate: number;
  data_bits: number;
  parity: string;
  stop_bits: number;
}

export interface ModbusResponse {
  ts: number;
  slave_id: number;
  function_code: number;
  is_exception: boolean;
  exception_code: number | null;
  exception_text: string | null;
  data: number[];
  raw_request: number[];
  raw_response: number[];
  crc_ok: boolean;
  elapsed_ms: number;
  mode: string;
  slow: boolean;
}

export interface MonitorFrame {
  ts: number;
  raw: number[];
  slave_id: number;
  function_code: number;
  is_exception: boolean;
  exception_code: number | null;
  exception_text: string | null;
  data: number[];
  crc_ok: boolean;
}

export interface MonitorPair {
  request: MonitorFrame | null;
  response: MonitorFrame | null;
  elapsed_ms: number;
  retry_hint: boolean;
}

export type ConnMode = "RTU" | "TCP";
export type WorkMode = "query" | "monitor";

export interface RegisterMap {
  address: number;
  name: string;
  unit: string;
  scale: number;
}

export type ByteOrder = "AB" | "BA" | "ABCD" | "CDAB" | "BADC" | "DCBA";
