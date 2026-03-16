import { useState, useCallback } from 'react';

import { ItemForm, ItemSearch } from '../components';

/**
 * Items Page Component
 * Main container for item (fish type) management.
 * Implements FR-ITEM requirements.
 *
 * @param {function} onBack - Callback to navigate back to dashboard
 */
function Items() {
  // Modal state
  const [formOpened, setFormOpened] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Open form for new item
  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setFormOpened(true);
  }, []);

  // Open form for editing
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setFormOpened(true);
  }, []);

  // Close form
  const handleCloseForm = useCallback(() => {
    setFormOpened(false);
    setEditingItem(null);
  }, []);

  // Refresh list after save
  const handleSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-100 to-indigo-100 dark:from-gray-900 dark:to-slate-800">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-3 relative">
        <ItemSearch onEdit={handleEdit} onRefresh={{ refreshKey }} onAdd={handleAdd} />
      </div>

      {/* Item Form Modal */}
      <ItemForm
        opened={formOpened}
        onClose={handleCloseForm}
        item={editingItem}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default Items;
