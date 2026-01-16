export type CropStatus = 'Active' | 'Completed' | 'Archived';
export type VaccinationStatus = 'Pending' | 'Administered' | 'Missed';
export type InventoryStatus = 'In Stock' | 'Consumed';

export interface Crop {
    id: string;
    name: string;
    total_chicks: number;
    arrival_date: string;
    expected_harvest_date?: string;
    actual_harvest_date?: string;
    status: CropStatus;
    avg_weight_heavy?: number;
    avg_weight_medium?: number;
    avg_weight_light?: number;
    notes?: string;
    created_at?: string;
}

export interface ChickSource {
    id: string;
    crop_id: string;
    supplier_name: string; // 'ANIRITA', 'KENCHICK', etc.
    count: number;
    unit_price?: number;
    created_at?: string;
}

export interface FeedType {
    id: string;
    name: string; // 'C1', 'C2', 'C3', etc.
    brand?: string;
    description?: string;
    current_stock_kg?: number; // Total weight in kg
    reorder_level_kg?: number; // Repurposed: stores the number of bags from the last restock
    unit?: string;
    created_at?: string;
}

export type FeedAction = 'Restock' | 'Usage';

export interface FeedLog {
    id: string;
    feed_type_id?: string;
    crop_id?: string;
    action: FeedAction;
    c1_bags?: number;
    c2_bags?: number;
    c3_bags?: number;
    log_date: string;
    user_id?: string;
}

export type Vaccination = VaccinationSchedule;

export interface FeedInventory {
    id: string;
    crop_id: string;
    feed_type_id: string;
    quantity_bags: number;
    bag_weight_kg?: number;
    status: InventoryStatus;
    created_at?: string;
}

export interface DailyLog {
    id: string;
    crop_id: string;
    log_date: string;
    mortality: number;
    feed_consumed_kg: number;
    water_consumed_liters?: number;
    avg_weight_g?: number;
    notes?: string;
}

export interface VaccinationSchedule {
    id: string;
    crop_id: string;
    vaccine_name: string;
    standard_day?: number; // e.g., Day 7
    target_date: string;
    status: VaccinationStatus;
    administered_at?: string;
    notes?: string;
}
