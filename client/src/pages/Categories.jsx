import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

const CATEGORY_ICONS = ['🍔', '🚗', '🛍️', '📚', '🎮', '📄', '🏥', '✈️', '📦', '🏠', '🔧', '👕', '🐾', '💄', '📱'];
const CATEGORY_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#6b7280', '#a855f7', '#d946ef', '#f43f5e', '#84cc16'];

const Categories = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useToast();
  
  const [data, setData] = useState({ categories: [], totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    color: '#4f46e5'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/categories');
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', icon: CATEGORY_ICONS[0], color: CATEGORY_COLORS[0] });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    if (category.name === 'Other') {
      showToast('Cannot edit the "Other" category', 'warning');
      return;
    }
    setEditingCategory(category);
    setFormData({ name: category.name, icon: category.icon, color: category.color });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (editingCategory) {
        await apiCall(`/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        showToast('Category updated successfully');
      } else {
        await apiCall('/categories', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        showToast('Category created successfully');
      }
      
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (category.name === 'Other') {
      showToast('Cannot delete the "Other" category', 'error');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? All expenses in this category will be moved to "Other".`)) return;
    
    try {
      await apiCall(`/categories/${category.id}`, { method: 'DELETE' });
      showToast('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  if (loading && data.categories.length === 0) return <LoadingState message="Loading categories..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCategories} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Page Header */}
      <div className="flex justify-between items-center" style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '1.5rem 1.75rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <span className="eyebrow">Category Management</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Categories</h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Total Catalog Spent: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(data.totalSpent)}</strong>
          </p>
        </div>
        <Button onClick={openAddModal} variant="primary" size="md">+ Create Category</Button>
      </div>

      {/* Grid of Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }} className="categories-grid">
        {data.categories.length > 0 ? data.categories.map(cat => (
          <div key={cat.id} className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.35rem 1.5rem' }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div style={{ 
                    width: '46px', height: '46px', borderRadius: 'var(--radius-md)', 
                    backgroundColor: `${cat.color}15`, color: cat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' 
                  }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</h3>
                    <div className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.1rem' }}>{cat.transactionCount} transactions</div>
                  </div>
                </div>
                {cat.name !== 'Other' && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openEditModal(cat)} 
                      style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-tertiary)', cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Edit Category"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(cat)} 
                      style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-tertiary)', cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Delete Category"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-1" style={{ marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(cat.totalSpent)}</span>
                  <span className="text-secondary" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{cat.percentage}%</span>
                </div>
                <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.percentage}%`, height: '100%', backgroundColor: cat.color, borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState title="No categories found" description="Create a category to organize your expenses." actionLabel="Create Category" onAction={openAddModal} />
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input 
            label="Category Name *" 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            maxLength={50}
            placeholder="e.g. Groceries, Shopping, Travel"
          />
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Select Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {CATEGORY_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  style={{
                    width: '38px', height: '38px', fontSize: '1.25rem',
                    border: formData.icon === icon ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: formData.icon === icon ? 'var(--primary-light)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Color Theme</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {CATEGORY_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    backgroundColor: color,
                    border: formData.color === color ? '3px solid var(--text-primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.15s ease'
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (max-width: 640px) {
          .categories-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Categories;

