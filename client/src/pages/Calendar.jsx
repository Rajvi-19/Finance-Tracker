import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

// Date-only values from the API must not be passed to `new Date('YYYY-MM-DD')`.
const dateFromKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const Calendar = () => {
  const { formatCurrency } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateDetails, setDateDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await apiCall(`/analytics/calendar?year=${year}&month=${month}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (dayObj) => {
    setSelectedDate(dayObj.date);
    setDateDetails(null);
    setDetailsError(null);
    setIsModalOpen(true);
    
    try {
      setDetailsLoading(true);
      const res = await apiCall(`/analytics/calendar/${dayObj.date}`);
      setDateDetails(res);
    } catch (err) {
      console.error(err);
      setDetailsError('Could not load the spending details for this date. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'normal': return 'var(--status-normal)';
      case 'medium': return 'var(--status-medium)';
      case 'high': return 'var(--status-high)';
      default: return 'var(--bg-tertiary)';
    }
  };

  const renderCalendar = () => {
    if (!data) return null;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const cells = [...blanks, ...data.days];
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="card">
        <div className="card-body" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.65rem', marginBottom: '0.85rem' }}>
            {weekDays.map(d => (
              <div key={d} className="text-center text-muted fw-bold" style={{ fontSize: '0.78125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.65rem' }}>
            {cells.map((cell, i) => {
              if (cell === null) return <div key={`blank-${i}`} style={{ aspectRatio: '1' }} />;
              
              const today = new Date();
              const isToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-') === cell.date;
              const hasSpending = cell.totalSpent > 0;
              
              return (
                <div 
                  key={cell.date}
                  onClick={() => handleDateClick(cell)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-md)',
                    border: isToday ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    backgroundColor: getStatusColor(cell.status),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: hasSpending ? 1 : 0.7,
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <span style={{ 
                    fontWeight: isToday ? 800 : 600,
                    color: hasSpending ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '1rem'
                  }}>
                    {cell.day}
                  </span>
                  {hasSpending && (
                    <span style={{ 
                      fontSize: '0.65rem', 
                      color: '#ffffff', 
                      fontWeight: 700,
                      position: 'absolute',
                      bottom: '5px'
                    }}>
                      {formatCurrency(cell.totalSpent)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderLegend = () => {
    if (!data?.thresholdSettings) return null;
    const { mode, normalLimit, mediumLimit, averageDaily } = data.thresholdSettings;
    
    return (
      <div className="card">
        <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
            Spending Thresholds ({mode === 'average' ? 'Average-Based' : 'Fixed'})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div className="flex items-center gap-2">
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--status-normal)' }}></div>
              <span className="text-secondary" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                Normal (≤ {mode === 'fixed' ? formatCurrency(normalLimit) : `Avg x ${data.thresholdSettings.normalMultiplier}`})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--status-medium)' }}></div>
              <span className="text-secondary" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                Medium (≤ {mode === 'fixed' ? formatCurrency(mediumLimit) : `Avg x ${data.thresholdSettings.mediumMultiplier}`})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--status-high)' }}></div>
              <span className="text-secondary" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                High (&gt; {mode === 'fixed' ? formatCurrency(mediumLimit) : `Avg x ${data.thresholdSettings.mediumMultiplier}`})
              </span>
            </div>
          </div>
          {mode === 'average' && (
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.65rem' }}>
              Your current average daily spending is <strong>{formatCurrency(averageDaily)}</strong>.
            </p>
          )}
        </div>
      </div>
    );
  };

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
          <span className="eyebrow">Calendar View</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Spending Calendar</h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>Visualize your daily spending habits and thresholds day by day.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="secondary" size="sm" onClick={handlePrevMonth}>&larr; Prev</Button>
          <span style={{ padding: '0 0.85rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="secondary" size="sm" onClick={handleNextMonth}>Next &rarr;</Button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading calendar history..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCalendarData} />
      ) : (
        <>
          {renderCalendar()}
          {renderLegend()}
        </>
      )}

      {/* Date Details Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedDate ? dateFromKey(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date Details'}
      >
        {detailsLoading ? (
          <LoadingState message="Loading spending details..." />
        ) : detailsError ? (
          <ErrorState message={detailsError} onRetry={() => handleDateClick({ date: selectedDate })} />
        ) : dateDetails ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="flex justify-between items-center" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div className="text-secondary" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Total Spent</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{formatCurrency(dateDetails.totalSpent)}</div>
              </div>
              <div style={{ 
                padding: '0.35rem 0.85rem', 
                borderRadius: 'var(--radius-full)', 
                backgroundColor: getStatusColor(dateDetails.status),
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {dateDetails.status}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Transactions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dateDetails.expenses.length === 0 ? (
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>No spending recorded for this date.</p>
                ) : dateDetails.expenses.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center" style={{ padding: '0.55rem 0', borderBottom: '1px dashed var(--border-light)' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: 'var(--radius-md)', 
                        backgroundColor: `${exp.category.color}20`, color: exp.category.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                      }}>
                        {exp.category.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exp.merchant || exp.category.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{exp.paymentMethod}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatCurrency(exp.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

    </div>
  );
};

export default Calendar;

