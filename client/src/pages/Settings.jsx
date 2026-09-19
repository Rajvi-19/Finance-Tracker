import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../components/common/Toast';
import { apiCall } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingState from '../components/common/LoadingState';

const Settings = () => {
  const { user, logout, checkAuth } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currencyCode } = useCurrency();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ fullName: '' });
  const [settings, setSettings] = useState({
    currency: 'INR',
    thresholdMode: 'fixed',
    normalLimit: 500,
    mediumLimit: 1000,
    normalMultiplier: 1.0,
    mediumMultiplier: 1.5
  });
  
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, settingsRes] = await Promise.all([
        apiCall('/profile'),
        apiCall('/settings')
      ]);
      setProfile({ fullName: profileRes.profile.fullName });
      setSettings(settingsRes.settings);
    } catch (err) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await apiCall('/profile', { method: 'PUT', body: JSON.stringify(profile) });
      await checkAuth();
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      
      const payload = {
        ...settings,
        normalLimit: parseFloat(settings.normalLimit),
        mediumLimit: parseFloat(settings.mediumLimit),
        normalMultiplier: parseFloat(settings.normalMultiplier),
        mediumMultiplier: parseFloat(settings.mediumMultiplier),
      };

      await apiCall('/settings', { method: 'PUT', body: JSON.stringify(payload) });
      await checkAuth();
      showToast('Preferences saved successfully');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    try {
      setSavingPassword(true);
      await apiCall('/profile/password', { method: 'PUT', body: JSON.stringify(passwordForm) });
      showToast('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExport = async (format) => {
    try {
      window.location.href = `/api/export/${format}`;
    } catch (err) {
      showToast('Failed to export data', 'error');
    }
  };

  if (loading) return <LoadingState message="Loading account settings..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '840px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '1.5rem 1.75rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <span className="eyebrow">Account & Preferences</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Settings</h1>
        <p className="text-secondary" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>Manage your account details, currency preferences, thresholds, and exports.</p>
      </div>

      {/* Profile Section */}
      <section className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-light)', padding: '1.15rem 1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>User Profile</h2>
        </div>
        <div className="card-body" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '440px' }}>
            <Input 
              label="Email Address" 
              value={user?.email || ''} 
              disabled 
              helperText="Email address cannot be modified."
            />
            <Input 
              label="Full Name *" 
              value={profile.fullName} 
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} 
              required 
            />
            <div style={{ marginTop: '0.5rem' }}>
              <Button type="submit" variant="primary" disabled={savingProfile}>
                {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-light)', padding: '1.15rem 1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Application Preferences</h2>
        </div>
        <div className="card-body" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Input 
                label="Base Currency" 
                type="select" 
                value={settings.currency} 
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                style={{ flex: 1, minWidth: '200px' }}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </Input>

              <Input 
                label="Interface Theme" 
                type="select" 
                value={settings.theme} 
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                style={{ flex: 1, minWidth: '200px' }}
              >
                <option value="system">System Preference</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </Input>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Calendar Threshold Settings</h3>
              
              <Input 
                label="Threshold Calculation Mode" 
                type="select" 
                value={settings.thresholdMode} 
                onChange={(e) => setSettings({ ...settings, thresholdMode: e.target.value })}
                style={{ maxWidth: '320px' }}
              >
                <option value="fixed">Fixed Threshold Amounts</option>
                <option value="average">Daily Average Multiplier</option>
              </Input>

              {settings.thresholdMode === 'fixed' ? (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <Input 
                    label="Normal Spend Limit (🟢)" 
                    type="number" 
                    value={settings.normalLimit} 
                    onChange={(e) => setSettings({ ...settings, normalLimit: e.target.value })}
                    style={{ flex: 1, minWidth: '160px' }}
                    helperText="Amounts under this are highlighted Green"
                  />
                  <Input 
                    label="Medium Spend Limit (🟡)" 
                    type="number" 
                    value={settings.mediumLimit} 
                    onChange={(e) => setSettings({ ...settings, mediumLimit: e.target.value })}
                    style={{ flex: 1, minWidth: '160px' }}
                    helperText="Amounts under this are highlighted Yellow"
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <Input 
                    label="Normal Multiplier (🟢)" 
                    type="number" 
                    step="0.1"
                    value={settings.normalMultiplier} 
                    onChange={(e) => setSettings({ ...settings, normalMultiplier: e.target.value })}
                    style={{ flex: 1, minWidth: '160px' }}
                    helperText="e.g. 1.0 = 100% of daily average"
                  />
                  <Input 
                    label="Medium Multiplier (🟡)" 
                    type="number" 
                    step="0.1"
                    value={settings.mediumMultiplier} 
                    onChange={(e) => setSettings({ ...settings, mediumMultiplier: e.target.value })}
                    style={{ flex: 1, minWidth: '160px' }}
                    helperText="e.g. 1.5 = 150% of daily average"
                  />
                </div>
              )}
            </div>

            <div>
              <Button type="submit" variant="primary" disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Security Section */}
      {user?.hasPassword && (
        <section className="card">
          <div className="card-body" style={{ borderBottom: '1px solid var(--border-light)', padding: '1.15rem 1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Security & Password</h2>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '440px' }}>
              <Input 
                label="Current Password *" 
                type="password" 
                value={passwordForm.currentPassword} 
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                required 
              />
              <Input 
                label="New Password *" 
                type="password" 
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                required 
              />
              <div style={{ marginTop: '0.5rem' }}>
                <Button type="submit" variant="primary" disabled={savingPassword}>
                  {savingPassword ? 'Changing...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Data Management Section */}
      <section className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-light)', padding: '1.15rem 1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Data & Export</h2>
        </div>
        <div className="card-body" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Export Your Financial Data</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Download a complete record of your expenses in CSV or JSON format.</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}>Export as CSV</Button>
                <Button variant="secondary" size="sm" onClick={() => handleExport('json')}>Export as JSON</Button>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>Danger Zone</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Permanently delete your account and remove all transaction history. This action cannot be undone.</p>
              <Button variant="danger" size="sm" onClick={() => {
                if(window.confirm('Are you absolutely sure? This will delete ALL your data and cannot be undone.')) {
                  apiCall('/profile/account', { method: 'DELETE' }).then(() => window.location.href = '/login');
                }
              }}>Delete Account Permanently</Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Settings;

