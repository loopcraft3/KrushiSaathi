import React, { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import RoleSelector from './RoleSelector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tractor, Calendar, Clock, IndianRupee, X,
  CheckCircle, AlertCircle, Plus, Pencil, Trash2,
  Store, History, ArrowLeft, Upload
} from 'lucide-react';
import {
  getAllEquipment, createBooking, getMyBookings, getBookingHistory,
  cancelBooking, getVendorEquipment, addEquipment, updateEquipment,
  deleteEquipment, getVendorBookings, Equipment, Booking
} from '@/services/rentalApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1605338803502-2f47e6b891b2?w=400&h=250&fit=crop';

// ── IMAGE COMPONENT ──────────────────────────────────────────────────
const EquipmentImage: React.FC<{ src?: string; alt: string; className?: string }> = ({ src, alt, className }) => (
  <img
    src={src ? (src.startsWith('/static') ? `${API_BASE}${src}` : src) : DEFAULT_IMAGE}
    alt={alt}
    className={className}
    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
  />
);

// ── ALERT COMPONENT ──────────────────────────────────────────────────
const Alert: React.FC<{ type: 'error' | 'success'; message: string; onClose: () => void }> = ({ type, message, onClose }) => (
  <div className={`mb-4 flex items-center gap-2 p-4 rounded-xl border text-sm ${
    type === 'error'
      ? 'bg-destructive/10 border-destructive/20 text-destructive'
      : 'bg-green-500/10 border-green-500/20 text-green-700'
  }`}>
    {type === 'error' ? <AlertCircle className="h-4 w-4 flex-shrink-0" /> : <CheckCircle className="h-4 w-4 flex-shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-auto"><X className="h-4 w-4" /></button>
  </div>
);

// ── FARMER VIEW ──────────────────────────────────────────────────────
const FarmerView: React.FC<{ userId: string }> = ({ userId }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eq, bk, hist] = await Promise.all([
        getAllEquipment(),
        getMyBookings(userId),
        getBookingHistory(userId),
      ]);
      setEquipment(eq);
      setBookings(bk);
      setHistory(hist);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedEquipment || !startTime || !endTime) {
      setError('Please select equipment and both times.');
      return;
    }
    try {
      setBookingLoading(true);
      setError(null);
      await createBooking(userId, {
        equipment_id: selectedEquipment._id,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      });
      setSuccess(`✅ ${selectedEquipment.name} booked successfully!`);
      setSelectedEquipment(null);
      setStartTime('');
      setEndTime('');
      await loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBookingLoading(false);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(userId, id);
      setSuccess('Booking cancelled.');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const estimatedPrice = () => {
    if (!selectedEquipment || !startTime || !endTime) return null;
    const hours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000;
    if (hours <= 0) return null;
    return (hours * selectedEquipment.price_per_hour).toFixed(2);
  };

  return (
    <div>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Equipment Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Available Equipment</CardTitle>
              <CardDescription>Click any equipment to select it for booking</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading equipment...</div>
              ) : equipment.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No equipment available yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipment.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => setSelectedEquipment(item)}
                      className={`rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg ${
                        selectedEquipment?._id === item._id
                          ? 'border-primary shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <EquipmentImage
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground">{item.name}</h3>
                          <Badge variant="secondary">{item.type}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <IndianRupee className="h-4 w-4" />
                          <span>{item.price_per_hour}/hour</span>
                        </div>
                        {selectedEquipment?._id === item._id && (
                          <p className="text-xs text-primary mt-1 font-medium">✓ Selected</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {showHistory ? 'Booking History' : 'My Active Bookings'}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  <History className="h-4 w-4 mr-1" />
                  {showHistory ? 'Show Active' : 'View History'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const list = showHistory ? history : bookings;
                if (loading) return <div className="text-center py-6 text-muted-foreground">Loading...</div>;
                if (list.length === 0) return (
                  <div className="text-center py-6 text-muted-foreground">
                    {showHistory ? 'No booking history yet.' : 'No active bookings.'}
                  </div>
                );
                return (
                  <div className="space-y-3">
                    {list.map((booking) => (
                      <div key={booking._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                        <EquipmentImage
                          src={booking.equipment_image}
                          alt={booking.equipment_name || ''}
                          className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{booking.equipment_name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(booking.start_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            <span>→</span>
                            <span>{new Date(booking.end_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-bold text-primary mt-1">
                            <IndianRupee className="h-3 w-3" />{booking.total_price}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={booking.status === 'active'
                            ? 'bg-green-500/10 text-green-700 border-green-500/20'
                            : 'bg-muted text-muted-foreground'
                          }>
                            {booking.status}
                          </Badge>
                          {booking.status === 'active' && (
                            <Button
                              variant="outline" size="sm"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                              onClick={() => handleCancel(booking._id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Book Equipment</CardTitle>
              <CardDescription>
                {selectedEquipment ? `Booking: ${selectedEquipment.name}` : 'Select equipment from list'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEquipment ? (
                <div className="rounded-xl overflow-hidden border border-primary/20">
                  <EquipmentImage src={selectedEquipment.image_url} alt={selectedEquipment.name} className="w-full h-32 object-cover" />
                  <div className="p-3 bg-primary/5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{selectedEquipment.name}</p>
                      <p className="text-xs text-muted-foreground">₹{selectedEquipment.price_per_hour}/hour</p>
                    </div>
                    <button onClick={() => setSelectedEquipment(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-border text-center text-sm text-muted-foreground">
                  ← Select equipment from the list
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium">Start Date & Time</label>
                <input type="datetime-local" value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">End Date & Time</label>
                <input type="datetime-local" value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime || new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {estimatedPrice() && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-muted-foreground">Estimated Total</p>
                  <p className="text-xl font-bold text-green-700 flex items-center gap-1">
                    <IndianRupee className="h-5 w-5" />{estimatedPrice()}
                  </p>
                </div>
              )}

              <Button className="w-full" onClick={handleBook}
                disabled={bookingLoading || !selectedEquipment || !startTime || !endTime}>
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Overlapping bookings are automatically rejected</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ── VENDOR VIEW ──────────────────────────────────────────────────────
const VendorView: React.FC<{ userId: string }> = ({ userId }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ name: '', type: '', price_per_hour: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eq, bk] = await Promise.all([
        getVendorEquipment(userId),
        getVendorBookings(userId),
      ]);
      setEquipment(eq);
      setBookings(bk);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', type: '', price_per_hour: '' });
    setImageFile(null);
    setImagePreview(null);
    setEditingEquipment(null);
    setShowAddForm(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.type || !form.price_per_hour) {
      setError('Please fill all fields.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('type', form.type);
      formData.append('price_per_hour', form.price_per_hour);
      if (imageFile) formData.append('image', imageFile);

      if (editingEquipment) {
        await updateEquipment(userId, editingEquipment._id, formData);
        setSuccess('Equipment updated successfully!');
      } else {
        await addEquipment(userId, formData);
        setSuccess('Equipment added successfully!');
      }
      resetForm();
      await loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleEdit = (item: Equipment) => {
    setForm({ name: item.name, type: item.type, price_per_hour: String(item.price_per_hour) });
    setEditingEquipment(item);
    setImagePreview(item.image_url ? `${API_BASE}${item.image_url}` : null);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this equipment?')) return;
    try {
      await deleteEquipment(userId, id);
      setSuccess('Equipment deleted.');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingEquipment ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Equipment Name</label>
                <input
                  type="text" placeholder="e.g. Mahindra 575 Tractor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <input
                  type="text" placeholder="e.g. Tractor"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Price per Hour (₹)</label>
                <input
                  type="number" placeholder="e.g. 250"
                  value={form.price_per_hour}
                  onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipment Image (optional)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  {imageFile ? imageFile.name : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="h-16 w-24 object-cover rounded-lg border border-border" />
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editingEquipment ? 'Update Equipment' : 'Add Equipment'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Equipment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                My Equipment Listings
              </CardTitle>
              <CardDescription>Equipment you have listed for rent</CardDescription>
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Equipment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No equipment listed yet. Click "Add Equipment" to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((item) => (
                <div key={item._id} className="rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <EquipmentImage src={item.image_url} alt={item.name} className="w-full h-36 object-cover" />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm text-foreground">{item.name}</h3>
                      <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-bold text-sm mb-3">
                      <IndianRupee className="h-3 w-3" />{item.price_per_hour}/hour
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleEdit(item)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs" onClick={() => handleDelete(item._id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings on my equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Bookings On My Equipment
          </CardTitle>
          <CardDescription>Farmers who have booked your equipment</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No bookings on your equipment yet.</div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                  <EquipmentImage
                    src={booking.equipment_image}
                    alt={booking.equipment_name || ''}
                    className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{booking.equipment_name}</p>
                    <p className="text-xs text-muted-foreground truncate">Farmer: {booking.user_id}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(booking.start_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span>→</span>
                      <span>{new Date(booking.end_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={booking.status === 'active'
                      ? 'bg-green-500/10 text-green-700 border-green-500/20'
                      : 'bg-muted text-muted-foreground'
                    }>
                      {booking.status}
                    </Badge>
                    <span className="text-sm font-bold text-primary flex items-center gap-0.5">
                      <IndianRupee className="h-3 w-3" />{booking.total_price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── MAIN PAGE ────────────────────────────────────────────────────────
const EquipmentRental: React.FC = () => {
  const { role, userId, setRole } = useRole();

  if (!role) return <RoleSelector />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            {role === 'farmer' ? <Tractor className="h-6 w-6 text-primary" /> : <Store className="h-6 w-6 text-primary" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {role === 'farmer' ? 'Equipment Rental' : 'Vendor Dashboard'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {role === 'farmer' ? 'Browse and book agricultural equipment' : 'Manage your equipment listings'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRole(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Switch Role
        </Button>
      </div>

      {role === 'farmer' ? <FarmerView userId={userId} /> : <VendorView userId={userId} />}
    </div>
  );
};

export default EquipmentRental;