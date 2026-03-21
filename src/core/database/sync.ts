import db from './init';
import { supabase } from '../services/supabase';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Bi-directional Sync Manager
// ---------------------------------------------------------------------------
// 1. Reads from the local SQLite `sync_queue` table.
// 2. Maps the operations to Supabase cloud tables.
// 3. Executes them and marks them as synced locally.
// ---------------------------------------------------------------------------

const SYNC_IN_PROGRESS_KEY = 'shiksha_ai_sync_in_progress';
let isSyncingInMemory = false;

export const SyncManager = {

    async isOnline(): Promise<boolean> {
        const state = await NetInfo.fetch();
        return !!state.isConnected && !!state.isInternetReachable;
    },

    async runSync() {
        if (!supabase) {
            return;
        }

        if (isSyncingInMemory) {
            return;
        }

        // Prevent overlapping sync processes
        const isSyncing = await AsyncStorage.getItem(SYNC_IN_PROGRESS_KEY);
        if (isSyncing === 'true') return;

        if (!(await this.isOnline())) {
            console.log('Skipping sync: Device is offline.');
            return;
        }

        try {
            isSyncingInMemory = true;
            await AsyncStorage.setItem(SYNC_IN_PROGRESS_KEY, 'true');
            console.log('Starting Supabase Sync...');

            // 1. Push Local Changes to Cloud
            await this.pushLocalChanges();

            // 2. Future: Pull Cloud Changes to Local (if multi-device support is needed)
            // await this.pullCloudChanges();

            console.log('Supabase Sync Complete.');
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            await AsyncStorage.setItem(SYNC_IN_PROGRESS_KEY, 'false');
            isSyncingInMemory = false;
        }
    },

    async pushLocalChanges() {
        if (!supabase) {
            return;
        }

        const supabaseClient: any = supabase;

        // Fetch all pending unsynced records
        const unsyncedOperations = await db.getAllAsync<{
            id: string;
            table_name: string;
            operation: string;
            record_id: string;
            payload: string;
        }>(`SELECT * FROM sync_queue WHERE synced = 0 ORDER BY createdAt ASC`);

        if (unsyncedOperations.length === 0) {
            return; // Nothing to sync
        }

        console.log(`Found ${unsyncedOperations.length} pending local mutations to sync.`);

        for (const op of unsyncedOperations) {
            try {
                const payload = JSON.parse(op.payload || '{}');
                const tableName = op.table_name;

                // Map sqlite operations to Supabase operations
                if (op.operation === 'INSERT' || op.operation === 'UPDATE') {
                    // Supabase upsert nicely handles both inserting new records and updating existing ones
                    // assuming the primary key 'id' exists.
                    const { error } = await supabaseClient
                        .from(tableName)
                        .upsert(payload, { onConflict: 'id' });

                    if (error) throw error;
                } else if (op.operation === 'DELETE') {
                    const { error } = await supabaseClient
                        .from(tableName)
                        .delete()
                        .match({ id: op.record_id });

                    if (error) throw error;
                }

                // Mark as synced locally so we don't process it again
                await db.runAsync(`UPDATE sync_queue SET synced = 1 WHERE id = ?`, [op.id]);

            } catch (err) {
                console.error(`Failed to sync operation ${op.id} on table ${op.table_name}:`, err);
                // We break and stop syncing right now to maintain order of operations.
                // It will retry on the next sync loop.
                break;
            }
        }
    },

    // Helper macro to enqueue mutations manually from services
    async enqueueMutation(tableName: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', recordId: string, payload: any) {
        try {
            const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
            await db.runAsync(
                `INSERT INTO sync_queue (id, table_name, operation, record_id, payload) VALUES (?, ?, ?, ?, ?)`,
                [id, tableName, operation, recordId, JSON.stringify(payload)]
            );

            // Attempt immediate sync
            this.runSync().catch(console.error);
        } catch (error) {
            console.error('Failed to enqueue sync mutation:', error);
        }
    }
};
