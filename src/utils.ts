import type { ByteOrder } from "./types";
import { FUNCTION_CODES } from "./constants";

export function formatHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("zh-CN", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

export function fcName(fc: number): string {
  const entry = FUNCTION_CODES.find((f) => f.code === (fc & 0x7f));
  if (fc & 0x80) return `异常 (0x${fc.toString(16).toUpperCase()})`;
  return entry ? entry.name : `0x${fc.toString(16).toUpperCase()}`;
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function applyByteOrder(data: number[], order: ByteOrder): number[] {
  if (order === "AB") return data;
  if (order === "BA") return data.map((v) => ((v & 0xFF) << 8) | ((v >> 8) & 0xFF));
  const result: number[] = [];
  for (let i = 0; i < data.length; i += 2) {
    if (i + 1 >= data.length) { result.push(data[i]); break; }
    const hi = data[i], lo = data[i + 1];
    let val32: number;
    switch (order) {
      case "ABCD": val32 = (hi << 16) | lo; break;
      case "CDAB": val32 = (lo << 16) | hi; break;
      case "BADC": val32 = (((hi & 0xFF) << 8 | (hi >> 8)) << 16) | ((lo & 0xFF) << 8 | (lo >> 8)); break;
      case "DCBA": val32 = (((lo & 0xFF) << 8 | (lo >> 8)) << 16) | ((hi & 0xFF) << 8 | (hi >> 8)); break;
      default: val32 = (hi << 16) | lo;
    }
    result.push(val32 >>> 0);
  }
  return result;
}

export function formatDataHex(data: number[]): string {
  return data.map((d) => "0x" + d.toString(16).toUpperCase().padStart(4, "0")).join(", ");
}

export function formatAddr(addr: number): string {
  return "0x" + addr.toString(16).toUpperCase().padStart(4, "0");
}
