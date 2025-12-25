import { Filament } from '../types';

const STORAGE_KEY = 'smartprint_inventory_v1';

export const loadFilaments = (): Filament[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load inventory', error);
    return [];
  }
};

export const saveFilaments = (filaments: Filament[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filaments));
  } catch (error) {
    console.error('Failed to save inventory', error);
  }
};