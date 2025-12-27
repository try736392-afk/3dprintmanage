import { Filament } from '../types';
import { getSupabase } from './supabaseClient';

// 确保表名为 'materials'
const TABLE_NAME = 'materials';

// 数据库映射 (DB snake_case -> App camelCase)
// 确保数据库中有对应的列: id, name, brand, material, color, total_weight, current_weight, created_at, last_used
const mapFromDb = (row: any): Filament => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  material: row.material,
  // 映射数据库的 color 字段 到应用的 colorHex
  colorHex: row.color,
  totalWeight: row.total_weight,
  currentWeight: row.current_weight,
  // 确保 createdAt 是数字类型 (时间戳)，如果数据库返回 ISO 字符串则转换
  createdAt: typeof row.created_at === 'string' ? new Date(row.created_at).getTime() : row.created_at,
  // 使用存储的 last_used，如果为空则回退到创建时间
  lastUsed: row.last_used || (row.created_at ? new Date(row.created_at).toISOString() : undefined)
});

// 数据库映射 (App camelCase -> DB snake_case)
const mapToDb = (filament: Filament) => ({
  id: filament.id,
  name: filament.name,
  brand: filament.brand,
  material: filament.material,
  // 映射应用的 colorHex 到数据库的 color 字段
  color: filament.colorHex,
  total_weight: filament.totalWeight,
  current_weight: filament.currentWeight,
  // 存储为 ISO 字符串 (timestamptz) 以兼容 Supabase 默认格式
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

// 废弃的本地存储方法
export const loadFilaments = () => [];
export const saveFilaments = () => {};