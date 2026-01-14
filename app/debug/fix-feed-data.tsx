"use client"

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/supabase/client";

export default function FixFeedData() {
    const [status, setStatus] = useState<string>("Ready");
    const [isLoading, setIsLoading] = useState(false);

    const runFix = async () => {
        setIsLoading(true);
        setStatus("Calculating discrepancy...");

        try {
            const supabase = createClient();

            // 1. Get logs
            const { data: logs, error: logsError } = await supabase
                .from('feed_logs')
                .select('*');

            if (logsError) throw logsError;

            // 2. Calculate expected totals
            const expectedBags = { 'C1': 0, 'C2': 0, 'C3': 0 };
            logs?.forEach(log => {
                const multiplier = log.action === 'Restock' ? 1 : -1;
                expectedBags['C1'] += (log.c1_bags || 0) * multiplier;
                expectedBags['C2'] += (log.c2_bags || 0) * multiplier;
                expectedBags['C3'] += (log.c3_bags || 0) * multiplier;
            });

            // 3. Get current actuals from feed_types
            const { data: types, error: typesError } = await supabase
                .from('feed_types')
                .select('*');

            if (typesError) throw typesError;

            // 4. Update
            for (const [name, bags] of Object.entries(expectedBags)) {
                const expectedKg = bags * 50;
                const currentType = types?.find(t => t.name === name);

                if (currentType) {
                    if (currentType.current_stock_kg !== expectedKg) {
                        setStatus(`Fixing ${name}: ${currentType.current_stock_kg} -> ${expectedKg}...`);
                        await supabase
                            .from('feed_types')
                            .update({ current_stock_kg: expectedKg })
                            .eq('id', currentType.id);
                    }
                } else if (expectedKg > 0) {
                    // Create if missing but should exist
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase
                            .from('feed_types')
                            .insert({
                                name,
                                current_stock_kg: expectedKg,
                                user_id: user.id
                            });
                    }
                }
            }

            setStatus("Success: Inventory synced with logs.");
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-lg border border-neutral-100">
            <h2 className="text-xl font-bold mb-4">Feed Data Fixer</h2>
            <p className="mb-4 text-sm text-neutral-500">
                This tool recalculates current stock based on all historical logs and updates the inventory.
            </p>

            <div className="bg-neutral-50 p-4 rounded-lg mb-6 font-mono text-xs">
                {status}
            </div>

            <button
                onClick={runFix}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                Run Synchronization
            </button>
        </div>
    );
}
