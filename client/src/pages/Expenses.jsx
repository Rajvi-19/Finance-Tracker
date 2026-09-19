import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

const toDateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

const getDateRange = (preset, customStart, customEnd) => {
  const today = new Date();
  const end = toDateKey(today);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  if (preset === 'today') return { startDate: end, endDate: end };
  if (preset === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const date = toDateKey(yesterday);
    return { startDate: date, endDate: date };
  }
  if (preset === 'week') return { startDate: toDateKey(startOfWeek), endDate: end };
  if (preset === 'month') return { startDate: toDateKey(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: end };
  if (preset === 'lastMonth') return { startDate: toDateKey(new Date(today.getFullYear(), today.getMonth() - 1, 1)), endDate: toDateKey(new Date(today.getFullYear(), today.getMonth(), 0)) };
  if (preset === 'custom') return { startDate: customStart, endDate: customEnd };
  return {};
};

const Expenses = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useToast();
  
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);
  const [datePreset, setDatePreset] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sort, setSort] = useState('newest');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paymentMethod: 'Cash'
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiCall('/categories');
      setCategories(res.categories);
      if (res.categories.length > 0) {
        setFormData(prev => prev.categoryId ? prev : ({ ...prev, categoryId: res.categories[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit)
      });
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);
      const dateRange = getDateRange(datePreset, customStart, customEnd);
      if (dateRange.startDate) params.set('startDate', dateRange.startDate);
      if (dateRange.endDate) params.set('endDate', dateRange.endDate);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      params.set('sort', sort);

      const res = await apiCall(`/expenses?${params.toString()}`);
      setExpenses(res.expenses);
      setPagination(res.pagination);
      setTotalSpent(res.totalSpent || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedCategory, datePreset, customStart, customEnd, minAmount, maxAmount, sort]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    const delay = setTimeout(fetchExpenses, 250);
    return () => clearTimeout(delay);
  }, [fetchExpenses]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setDatePreset('month');
    setCustomStart('');
    setCustomEnd('');
    setMinAmount('');
    setMaxAmount('');
    setSort('newest');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const updateFilter = (setter, value) => {
    setter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      amount: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      merchant: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      paymentMethod: 'Cash'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      categoryId: expense.categoryId,
      merchant: expense.merchant || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      note: expense.note || '',
      paymentMethod: expense.paymentMethod
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingExpense) {
        await apiCall(`/expenses/${editingExpense.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Expense updated successfully');
      } else {
        await apiCall('/expenses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Expense added successfully');
      }
      
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      showToast(err.message || 'Failed to save expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await apiCall(`/expenses/${id}`, { method: 'DELETE' });
      showToast('Expense deleted');
      fetchExpenses();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Heading Banner */}
      <div className="expense-page-heading" style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '1.5rem 1.75rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <span className="eyebrow">Transaction Management</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Expense History</h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>Search, filter, edit, and categorize your transactions effortlessly.</p>
        </div>
        <div className="flex gap-2 expense-heading-actions">
          <Button onClick={openAddModal} variant="primary" size="md">+ Add Expense</Button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="expense-summary-card">
        <div className="expense-summary-content">
          <div>
            <div className="expense-summary-label">Filtered Spend Total</div>
            <div className="expense-summary-amount">{formatCurrency(totalSpent)}</div>
          </div>
          <div className="expense-summary-count">
            {pagination.total} {pagination.total === 1 ? 'transaction' : 'transactions'} found
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="card expense-history-card">
        <div className="expense-toolbar">
          <div className="search-control">
            <span aria-hidden="true">🔍</span>
            <input
              aria-label="Search expense history"
              placeholder="Search by merchant, note, or category..."
              value={search}
              onChange={(e) => updateFilter(setSearch, e.target.value)}
            />
            {search && <button type="button" className="icon-button" aria-label="Clear search" title="Clear search" onClick={() => updateFilter(setSearch, '')}>×</button>}
          </div>
          <button type="button" className="filter-toggle" aria-expanded={isFiltersOpen} onClick={() => setIsFiltersOpen(open => !open)}>⚙️ Filters {isFiltersOpen ? '▲' : '▼'}</button>
        </div>

        <div className={`expense-filters ${isFiltersOpen ? 'is-open' : ''}`}>
          <label>Category
            <select value={selectedCategory} onChange={(e) => updateFilter(setSelectedCategory, e.target.value)}>
              <option value="">All categories</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
            </select>
          </label>
          <label>Date Preset
            <select value={datePreset} onChange={(e) => updateFilter(setDatePreset, e.target.value)}>
              <option value="all">All time</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">This week</option><option value="month">This month</option><option value="lastMonth">Last month</option><option value="custom">Custom range</option>
            </select>
          </label>
          {datePreset === 'custom' && <div className="date-range-controls"><label>From<input type="date" value={customStart} onChange={(e) => updateFilter(setCustomStart, e.target.value)} /></label><label>To<input type="date" value={customEnd} onChange={(e) => updateFilter(setCustomEnd, e.target.value)} /></label></div>}
          <label>Sort By
            <select value={sort} onChange={(e) => updateFilter(setSort, e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select>
          </label>
          <div className="amount-controls"><label>Min Amount<input type="number" min="0" placeholder="0" value={minAmount} onChange={(e) => updateFilter(setMinAmount, e.target.value)} /></label><label>Max Amount<input type="number" min="0" placeholder="No limit" value={maxAmount} onChange={(e) => updateFilter(setMaxAmount, e.target.value)} /></label></div>
          <button type="button" className="clear-filters" onClick={resetFilters}>Reset filters</button>
        </div>

        <div className="expense-history-body">

          {loading && expenses.length === 0 ? (
            <LoadingState message="Loading transactions..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchExpenses} />
          ) : expenses.length === 0 ? (
            <EmptyState title="No transactions found" description="Try adjusting your search filters or add a new transaction." actionLabel="+ Add Expense" onAction={openAddModal} />
          ) : (
            <div className="expense-list">
              {expenses.map(exp => (
                <article key={exp.id} className="expense-row">
                  <div className="expense-row-main">
                    <div className="expense-icon" style={{ backgroundColor: `${exp.category?.color || '#4F46E5'}18`, color: exp.category?.color || 'var(--primary)' }}>
                      {exp.category?.icon || '📦'}
                    </div>
                    <div>
                      <div className="expense-merchant">{exp.merchant || exp.category?.name || 'Expense'}</div>
                      <div className="expense-meta">{exp.category?.name} · {exp.paymentMethod} · {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      {exp.note && <div className="expense-note">{exp.note}</div>}
                    </div>
                  </div>
                  <div className="expense-row-actions">
                    <div className="expense-amount">{formatCurrency(exp.amount)}</div>
                    <div className="expense-actions">
                      <Button variant="secondary" size="sm" onClick={() => openEditModal(exp)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(exp.id)}>Delete</Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center" style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <Button 
                variant="secondary" 
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                &larr; Previous
              </Button>
              <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button 
                variant="secondary" 
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next &rarr;
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Add / Edit Expense Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Input 
            label="Amount *" 
            type="number" 
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
            placeholder="0.00"
          />
          
          <Input 
            label="Category *" 
            type="select" 
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            required
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </Input>

          <Input 
            label="Date *" 
            type="date" 
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />

          <Input 
            label="Merchant / Place" 
            type="text" 
            value={formData.merchant}
            onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
            placeholder="e.g. Amazon, Starbucks"
          />

          <Input 
            label="Payment Method" 
            type="select" 
            value={formData.paymentMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </Input>

          <Input 
            label="Note (Optional)" 
            type="text" 
            value={formData.note}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            placeholder="Additional details..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Expenses;

