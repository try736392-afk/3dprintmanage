import { Filament } from '../types';
import { getSupabase } from './supabaseClient';

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
  // Use stored last_used, fallback to createdAt if null
  lastUsed: row.last_used || (row.created_at ? new Date(row.created_at).toISOString() : undefined)
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
  created_at: filament.createdAt,
  last_used: filament.lastUsed
});

export const fetchFilaments = async (): Promise<Filament[]> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Database not configured");

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
  const supabase = getSupabase();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert([mapToDb(filament)]);

  if (error) {
    console.error('Error adding filament:', error);
    throw error;
  }
};

export const updateFilament = async (filament: Filament): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Database not configured");

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
  const supabase = getSupabase();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting filament:', error);
    throw error;
  }
};

export const loadFilaments = () => [];
export const saveFilaments = () => {};