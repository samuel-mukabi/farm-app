"use server"
import { createClient } from "@/supabase/server";

export async function debugSchema() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('vaccinations').select('status').limit(10);
    if (error) return { error: error.message };
    return { data };
}

export async function debugInventory() {
    const supabase = await createClient();

    // Get all logs
    const { data: logs, error: logsError } = await supabase.from('feed_logs').select('*');
    if (logsError) return { error: logsError.message };
    if (!logs) return { error: "No logs found" };

    // Get current stock
    const { data: stocks, error: stocksError } = await supabase.from('feed_types').select('*');
    if (stocksError) return { error: stocksError.message };
    if (!stocks) return { error: "No stock found" };

    // Calculate expected stock
    const expected = { 'C1': 0, 'C2': 0, 'C3': 0 };

    logs.forEach((log: any) => {
        const sign = log.action === 'Restock' ? 1 : -1;
        expected['C1'] += (log.c1_bags || 0) * 50 * sign;
        expected['C2'] += (log.c2_bags || 0) * 50 * sign;
        expected['C3'] += (log.c3_bags || 0) * 50 * sign;
    });

    return {
        logs_count: logs.length,
        current_stock: stocks,
        calculated_from_logs: expected,
        discrepancy: {
            C1: expected['C1'] - (stocks.find((s: any) => s.name === 'C1')?.current_stock_kg || 0),
            C2: expected['C2'] - (stocks.find((s: any) => s.name === 'C2')?.current_stock_kg || 0),
            C3: expected['C3'] - (stocks.find((s: any) => s.name === 'C3')?.current_stock_kg || 0),
        }
    };
}
