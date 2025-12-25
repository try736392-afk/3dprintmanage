import { Filament } from '../types';
import { supabase } from './supabaseClient';

const TABLE_NAME = 'filaments';

// Map DB snake_case to App camelCase
const mapFromDb = (row: any): Filament => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  material: row.material,
  colorHex: row.color_hex,
  totalWeight: row.total_weight,
  currentWeight: row.current_weight,
  createdAt: row.created_at,
  lastUsed: row.created_at ? new Date(row.created_at).toISOString() : undefined // Approximation
});

// Map App camelCase to DB snake_case
const mapToDb = (filament: Filament) => ({
  id: filament.id,
  name: filament.name,
  brand: filament.brand,
  material: filament.material,
  color_hex: filament.colorHex,
  total_weight: filament.totalWeight,
  current_weight: filament.currentWeight,
  created_at: filament.createdAt
});

export const fetchFilaments = async (): Promise<Filament[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching filaments:', error);
    throw error;
  }

  return (data || []).map(mapFromDb);
};

export const addFilament = async (filament: Filament): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .insert([mapToDb(filament)]);

  if (error) {
    console.error('Error adding filament:', error);
    throw error;
  }
};

export const updateFilament = async (filament: Filament): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update(mapToDb(filament))
    .eq('id', filament.id);

  if (error) {
    console.error('Error updating filament:', error);
    throw error;
  }
};

export const deleteFilament = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting filament:', error);
    throw error;
  }
};

// Deprecated LocalStorage functions kept empty to avoid breaking imports during migration if needed,
// but in this refactor we will remove their usage from App.tsx
export const loadFilaments = () => [];
export const saveFilaments = () => {};