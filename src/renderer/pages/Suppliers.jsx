import { useState, useCallback } from 'react';

import { SupplierForm, SupplierSearch } from '../components';

/**
 * Suppliers Page Component
 * Main container for supplier management.
 * Implements FR-SUP requirements and FR-SUP-SEARCH requirements.
 *
 * @param {function} onBack - Callback to navigate back to dashboard
 */
function Suppliers() {
  // Modal state
  const [formOpened, setFormOpened] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Open form for new supplier
  const handleAdd = useCallback(() => {
    setEditingSupplier(null);
    setFormOpened(true);
  }, []);

  // Open form for editing
  const handleEdit = useCallback((supplier) => {
    setEditingSupplier(supplier);
    setFormOpened(true);
  }, []);

  // Close form
  const handleCloseForm = useCallback(() => {
    setFormOpened(false);
    setEditingSupplier(null);
  }, []);

  // Refresh list after save
  const handleSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-100 to-green-100 dark:from-gray-900 dark:to-slate-800">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-3 relative">
        <SupplierSearch onEdit={handleEdit} onRefresh={{ refreshKey }} onAdd={handleAdd} />
      </div>

      {/* Supplier Form Modal */}
      <SupplierForm
        opened={formOpened}
        onClose={handleCloseForm}
        supplier={editingSupplier}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default Suppliers;
