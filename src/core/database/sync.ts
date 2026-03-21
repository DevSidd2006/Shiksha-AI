// Local-only sync manager
// Cloud synchronization has been removed from the app.
export const SyncManager = {
  async isOnline(): Promise<boolean> {
    return true;
  },

  async runSync(): Promise<void> {
    return;
  },

  async pushLocalChanges(): Promise<void> {
    return;
  },

  async enqueueMutation(
    _tableName: string,
    _operation: 'INSERT' | 'UPDATE' | 'DELETE',
    _recordId: string,
    _payload: any
  ): Promise<void> {
    return;
  },
};
