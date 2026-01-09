
import { Filament } from '../types';
import { getSupabase } from './supabaseClient';

const TABLE_NAME = 'materials';

const mapFromDb = (row: any): Filament => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  material: row.material,
  colorHex: row.color,
  totalWeight: row.total_weight,
  currentWeight: row.current_weight,
  pricePerKg: row.price_per_kg || 0,
  createdAt: typeof row.created_at === 'string' ? new Date(row.created_at).getTime() : row.created_at,
  lastUsed: row.last_used || (row.created_at ? new Date(row.created_at).toISOString() : undefined)
});

const mapToDb = (filament: Filament) => ({
  id: filament.id,
  name: filament.name,
  brand: filament.brand,
  material: filament.material,
  color: filament.colorHex,
  total_weight: filament.totalWeight,
  current_weight: filament.currentWeight,
  price_per_kg: filament.pricePerKg,
  created_at: new Date(filament.createdAt).toISOString(),
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
    console.error(`Error fetching from ${TABLE_NAME}:`, error);
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
    console.error(`Error adding to ${TABLE_NAME}:`, error);
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
    console.error(`Error updating ${TABLE_NAME}:`, error);
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
    console.error(`Error deleting from ${TABLE_NAME}:`, error);
    throw error;
  }
};

export const loadFilaments = () => [];
export const saveFilaments = () => {};
