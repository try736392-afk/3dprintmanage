
export enum MaterialType {
  PLA = 'PLA',
  PETG = 'PETG',
  ABS = 'ABS',
  TPU = 'TPU',
  ASA = 'ASA',
  RESIN = 'RESIN',
  OTHER = 'OTHER'
}

export interface Filament {
  id: string;
  name: string;
  brand: string;
  material: MaterialType;
  colorHex: string;
  totalWeight: number; // in grams, usually 1000g
  currentWeight: number; // in grams
  pricePerKg: number; // in CNY per 1000g
  lastUsed?: string;
  createdAt: number;
}

export interface PrintJob {
  id: string;
  filamentId: string;
  weightUsed: number;
  date: string;
  note?: string;
}

export type ThemeColor = 'green' | 'yellow' | 'red' | 'blue';
