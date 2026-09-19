import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const { formatCurrency } = useCurrency();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [insights, setInsights] = useState([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const [monthlyRes, insightsRes] = await Promise.all([
        apiCall(`/analytics/monthly?year=${year}&month=${month}`),
        apiCall('/analytics/insights')
      ]);
      
      setMonthlyData(monthlyRes);
      setInsights(insightsRes.insights);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (loading) return <LoadingState message="Calculating analytics & insights..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!monthlyData) return null;

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
          <span className="eyebrow">Financial Reports</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Analytics & Trends</h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>Analyze your monthly spending trends, averages, and spending signals.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="secondary" size="sm" onClick={handlePrevMonth}>&larr; Prev</Button>
          <span style={{ padding: '0 0.85rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="secondary" size="sm" onClick={handleNextMonth}>Next &rarr;</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            <span className="text-muted fw-semibold" style={{ fontSize: '0.78125rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Total</span>
            <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.35rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {formatCurrency(monthlyData.currentTotal)}
            </div>
            {monthlyData.changePercent !== null && (
              <div style={{ 
                color: monthlyData.changePercent > 0 ? 'var(--danger)' : 'var(--success)',
                fontSize: '0.8125rem', marginTop: '0.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}>
                {monthlyData.changePercent > 0 ? '↑' : '↓'} {Math.abs(monthlyData.changePercent)}% versus last month
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            <span className="text-muted fw-semibold" style={{ fontSize: '0.78125rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transactions</span>
            <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.35rem', color: 'var(--text-primary)' }}>
              {monthlyData.transactionCount}
            </div>
            <div className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.35rem' }}>
              Average {formatCurrency(monthlyData.transactionCount > 0 ? monthlyData.currentTotal / monthlyData.transactionCount : 0)} / tx
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            <span className="text-muted fw-semibold" style={{ fontSize: '0.78125rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Daily Average</span>
            <div style={{ fontSize: '1.85rem', fontWeight: '800', marginTop: '0.35rem', color: 'var(--text-primary)' }}>
              {formatCurrency(monthlyData.currentTotal / (new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()))}
            </div>
            <div className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.35rem' }}>
              Spread over {new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()} days
            </div>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-light)', padding: '1.15rem 1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Daily Spending Trend</h2>
        </div>
        <div className="card-body" style={{ padding: '1.5rem' }}>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${theme}`} data={monthlyData.dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => value > 0 ? `${value / 1000}k` : 0}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Spent']}
                  labelFormatter={(label) => `Day ${label}`}
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', padding: '0.75rem 1rem' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}
                  itemStyle={{ color: 'var(--primary)', fontWeight: 600 }}
                />
                <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-light)', padding: '1.15rem 1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Smart Financial Insights</h2>
        </div>
        <div className="card-body" style={{ padding: '1.5rem' }}>
          {insights.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '1.25rem' }}>💡</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary text-center" style={{ padding: '2rem 0', margin: 0 }}>Not enough transaction history this month to generate smart insights.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default Analytics;

