import type { ByteOrder } from "./types";

export const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];
export const DATA_BITS = [7, 8];
export const PARITIES = ["None", "Even", "Odd"];
export const STOP_BITS = [1, 2];

export const FUNCTION_CODES = [
  { code: 0x01, name: "01 读线圈", type: "read" },
  { code: 0x02, name: "02 读离散输入", type: "read" },
  { code: 0x03, name: "03 读保持寄存器", type: "read" },
  { code: 0x04, name: "04 读输入寄存器", type: "read" },
  { code: 0x05, name: "05 写单个线圈", type: "write-single" },
  { code: 0x06, name: "06 写单个寄存器", type: "write-single" },
  { code: 0x0f, name: "0F 写多个线圈", type: "write-multiple" },
  { code: 0x10, name: "10 写多个寄存器", type: "write-multiple" },
];

export const BYTE_ORDERS: { value: ByteOrder; label: string }[] = [
  { value: "AB", label: "AB (Big Endian 16位)" },
  { value: "BA", label: "BA (Little Endian 16位)" },
  { value: "ABCD", label: "ABCD (Big Endian 32位)" },
  { value: "CDAB", label: "CDAB (Word Swap 32位)" },
  { value: "BADC", label: "BADC (Byte Swap 32位)" },
  { value: "DCBA", label: "DCBA (Little Endian 32位)" },
];
