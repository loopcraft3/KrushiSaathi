// pages/AdminPanel.tsx
// Secret admin panel — only accessible at /admin

import React, { useState, useEffect } from 'react';
import { Users, Tractor, Calendar, Trash2, X, AlertCircle, CheckCircle, IndianRupee, Clock, Shield } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Admin credentials — must match backend .env
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'krushi@admin123';
const AUTH_HEADER = 'Basic ' + btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`);

interface Stats {
  users: { total: number; farmers: number; vendors: number };
  equipment: { total: number };
  bookings: { total: number; active: number; cancelled: number };
}

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'equipment' | 'bookings'>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Wrong password!');
    }
  };

  const fetchData = async (tab: string) => {
    try {
      setLoading(true);
      setError(null);

      if (tab === 'stats') {
        const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: AUTH_HEADER } });
        const data = await res.json();
        setStats(data.data);
      } else if (tab === 'users') {
        const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: AUTH_HEADER } });
        const data = await res.json();
        setUsers(data.data);
      } else if (tab === 'equipment') {
        const res = await fetch(`${API_BASE}/api/admin/equipment`, { headers: { Authorization: AUTH_HEADER } });
        const data = await res.json();
        setEquipment(data.data);
      } else if (tab === 'bookings') {
        const res = await fetch(`${API_BASE}/api/admin/bookings`, { headers: { Authorization: AUTH_HEADER } });
        const data = await res.json();
        setBookings(data.data);
      }
    } catch (e: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData(activeTab);
  }, [isAuthenticated, activeTab]);

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Delete this ${type}?`)) return;
    try {
      const url = type === 'booking'
        ? `${API_BASE}/api/admin/bookings/${id}`
        : `${API_BASE}/api/admin/${type}s/${id}`;

      await fetch(url, { method: 'DELETE', headers: { Authorization: AUTH_HEADER } });
      setSuccess(`${type} deleted successfully`);
      fetchData(activeTab);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Delete failed');
    }
  };

  // Admin login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">KrushiSaathi — Restricted Access</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {authError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />{authError}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Admin Password</label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={handleAdminLogin}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Access Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">KrushiSaathi Platform Control</p>
          </div>
        </div>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <X className="h-4 w-4" /> Logout
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertCircle className="h-4 w-4" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 text-sm border border-green-500/20">
          <CheckCircle className="h-4 w-4" />{success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'stats', label: 'Dashboard', icon: Shield },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'equipment', label: 'Equipment', icon: Tractor },
          { key: 'bookings', label: 'Bookings', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : (
        <>
          {/* STATS TAB */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Users</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.users.total}</p>
                <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                  <span>🌾 {stats.users.farmers} Farmers</span>
                  <span>🏪 {stats.users.vendors} Vendors</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Tractor className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Equipment</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.equipment.total}</p>
                <p className="mt-2 text-sm text-muted-foreground">Total listings</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Bookings</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.bookings.total}</p>
                <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                  <span>✅ {stats.bookings.active} Active</span>
                  <span>❌ {stats.bookings.cancelled} Cancelled</span>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">All Users ({users.length})</h2>
              </div>
              <div className="divide-y divide-border">
                {users.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No users yet</p>
                ) : users.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.role === 'farmer'
                          ? 'bg-green-500/10 text-green-700'
                          : 'bg-blue-500/10 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : ''}
                      </p>
                      <button
                        onClick={() => handleDelete('user', user._id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EQUIPMENT TAB */}
          {activeTab === 'equipment' && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">All Equipment ({equipment.length})</h2>
              </div>
              <div className="divide-y divide-border">
                {equipment.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No equipment yet</p>
                ) : equipment.map(eq => (
                  <div key={eq._id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                    <div>
                      <p className="font-medium text-foreground">{eq.name}</p>
                      <p className="text-sm text-muted-foreground">{eq.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary flex items-center gap-0.5">
                        <IndianRupee className="h-3 w-3" />{eq.price_per_hour}/hr
                      </span>
                      <button
                        onClick={() => handleDelete('equipment', eq._id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">All Bookings ({bookings.length})</h2>
              </div>
              <div className="divide-y divide-border">
                {bookings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No bookings yet</p>
                ) : bookings.map(booking => (
                  <div key={booking._id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{booking.equipment_name || booking.equipment_id}</p>
                      <p className="text-xs text-muted-foreground">By: {booking.user_name || booking.user_id}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(booking.start_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span>→</span>
                        <span>{new Date(booking.end_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          booking.status === 'active'
                            ? 'bg-green-500/10 text-green-700'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="text-sm font-bold text-primary mt-1 flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />{booking.total_price}
                        </p>
                      </div>
                      {booking.status === 'active' && (
                        <button
                          onClick={() => handleDelete('booking', booking._id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;