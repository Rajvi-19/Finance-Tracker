import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { apiCall } from '../services/api';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiCall('/analytics/summary');
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading financial dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboardData} />;
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Hero Banner - Greeting and Primary Action */}
      <div className="flex justify-between items-center dashboard-header" style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '1.5rem 1.75rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <span className="eyebrow">Financial Dashboard</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.fullName?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Here is your real-time spending overview and budget summary.</p>
        </div>
        <Link to="/expenses">
          <Button size="md" variant="primary">
            + Add Expense
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.25rem' 
      }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            <span className="text-muted fw-semibold" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Spent</span>
            <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.35rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {formatCurrency(data.totalSpent)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All-time logged</span>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            <span className="text-muted fw-semibold" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Spent Today</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.35rem', color: 'var(--text-primary)' }}>
              {formatCurrency(data.todaySpent)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today's transactions</span>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            <span className="text-muted fw-semibold" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>This Week</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.35rem', color: 'var(--text-primary)' }}>
              {formatCurrency(data.weekSpent)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 7 days</span>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            <span className="text-muted fw-semibold" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>This Month</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.35rem', color: 'var(--text-primary)' }}>
              {formatCurrency(data.monthSpent)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current month total</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Category Breakdown */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-body" style={{ borderBottom: '1px solid var(--border-light)', padding: '1.15rem 1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Category Breakdown</h2>
          </div>
          <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.topCategories?.length > 0 ? (
              <>
                <div style={{ height: '210px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.topCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={82}
                        paddingAngle={4}
                        dataKey="totalSpent"
                        nameKey="name"
                      >
                        {data.topCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-secondary)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {data.topCategories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center" style={{ padding: '0.35rem 0' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: 'var(--radius-md)', 
                          backgroundColor: `${cat.color}15`, 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem' 
                        }}>{cat.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{formatCurrency(cat.totalSpent)}</span>
                        <span className="text-muted" style={{ width: '42px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 500 }}>{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="No expenses yet" description="Start tracking to see category breakdown." icon="📊" />
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-body flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-light)', padding: '1.15rem 1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Recent Transactions</h2>
            <Link to="/expenses" className="text-primary" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>View All &rarr;</Link>
          </div>
          <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.recentExpenses?.length > 0 ? (
              data.recentExpenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center" style={{ 
                  padding: '0.75rem 0.85rem', 
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-light)' 
                }}>
                  <div className="flex items-center gap-3">
                    <div style={{ 
                      width: '38px', height: '38px', borderRadius: 'var(--radius-md)', 
                      backgroundColor: `${exp.category?.color || '#4F46E5'}18`,
                      color: exp.category?.color || 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' 
                    }}>
                      {exp.category?.icon || '📦'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{exp.merchant || exp.category?.name || 'Expense'}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {exp.category?.name}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {formatCurrency(exp.amount)}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No recent expenses" description="Add an expense to see it here." icon="💸" />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .dashboard-header a {
            width: 100%;
          }
          .dashboard-header button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

