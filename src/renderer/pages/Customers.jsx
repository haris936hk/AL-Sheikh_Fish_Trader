import { useState, useCallback } from 'react';

import { CustomerForm, CustomerSearch } from '../components';

/**
 * Customers Page Component
 * Main container for customer management.
 * Implements FR-CUST requirements.
 *
 * @param {function} onBack - Callback to navigate back to dashboard
 */
function Customers() {
  // Modal state
  const [formOpened, setFormOpened] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Open form for new customer
  const handleAdd = useCallback(() => {
    setEditingCustomer(null);
    setFormOpened(true);
  }, []);

  // Open form for editing
  const handleEdit = useCallback((customer) => {
    setEditingCustomer(customer);
    setFormOpened(true);
  }, []);

  // Close form
  const handleCloseForm = useCallback(() => {
    setFormOpened(false);
    setEditingCustomer(null);
  }, []);

  // Refresh list after save
  const handleSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-100 to-green-100 dark:from-gray-900 dark:to-slate-800">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-3 relative">
        <CustomerSearch onEdit={handleEdit} onRefresh={{ refreshKey }} onAdd={handleAdd} />
      </div>

      {/* Customer Form Modal */}
      <CustomerForm
        opened={formOpened}
        onClose={handleCloseForm}
        customer={editingCustomer}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default Customers;
