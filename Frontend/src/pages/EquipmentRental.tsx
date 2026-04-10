import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tractor, Calendar, Clock, IndianRupee, X,
  CheckCircle, AlertCircle, Plus, Pencil, Trash2,
  Store, History, ArrowLeft, Upload, Search,
  Wheat, Droplets, Leaf, Package, ChevronRight
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import RoleSelector from './RoleSelector';
import {
  getAllEquipment, createBooking, getMyBookings, getBookingHistory,
  cancelBooking, getVendorEquipment, addEquipment, updateEquipment,
  deleteEquipment, getVendorBookings, getEquipmentAvailability,
} from '@/services/rentalApi';
import type { Equipment, Booking, BookedSlot } from '@/services/rentalApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// Default images per equipment type
const CATEGORY_IMAGES: Record<string, string> = {
  'Tractor': '/equipment-images/tractor.jpg',
  'Harvesting Equipment': '/equipment-images/harvester.jpg',
  'Spraying Equipment': '/equipment-images/sprayer.jpg',
  'Tiller': '/equipment-images/tiller.jpg',
  'Tillage Equipment': '/equipment-images/tiller.jpg',
  'Sowing Equipment': '/equipment-images/sowing.jpg',
};

const DEFAULT_IMAGE = '/equipment-images/default.jpg';
const getEquipmentImage = (src?: string, type?: string): string => {
  if (src) return src.startsWith('/static') ? `${API_BASE}${src}` : src;
  if (type && CATEGORY_IMAGES[type]) return CATEGORY_IMAGES[type];
  return DEFAULT_IMAGE;
};
// ── IMAGE COMPONENT ──────────────────────────────────────────────────
const EquipmentImage: React.FC<{ src?: string; alt: string; className?: string; type?: string }> = ({ src, alt, className, type }) => (
  <img
    src={getEquipmentImage(src, type)}
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

// ── CATEGORIES ───────────────────────────────────────────────────────
const categories = [
  { label: 'All Equipment', value: '', icon: Package, color: 'bg-gray-500/10 text-gray-600', border: 'hover:border-gray-400' },
  { label: 'Tractors', value: 'Tractor', icon: Tractor, color: 'bg-green-500/10 text-green-600', border: 'hover:border-green-400' },
  { label: 'Harvesters', value: 'Harvesting Equipment', icon: Wheat, color: 'bg-yellow-500/10 text-yellow-600', border: 'hover:border-yellow-400' },
  { label: 'Sprayers', value: 'Spraying Equipment', icon: Droplets, color: 'bg-blue-500/10 text-blue-600', border: 'hover:border-blue-400' },
  { label: 'Tillers', value: 'Tiller', icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600', border: 'hover:border-emerald-400' },
  { label: 'Sowing', value: 'Sowing Equipment', icon: Leaf, color: 'bg-lime-500/10 text-lime-600', border: 'hover:border-lime-400' },
  { label: 'Tillage', value: 'Tillage Equipment', icon: Tractor, color: 'bg-orange-500/10 text-orange-600', border: 'hover:border-orange-400' },
];
// ── AVAILABILITY CALENDAR POPUP ──────────────────────────────────────
const AvailabilityPopup: React.FC<{
  equipment: Equipment;
  onClose: () => void;
  onBook: (equipment: Equipment, start: string, end: string) => void;
}> = ({ equipment, onClose, onBook }) => {
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const slots = await getEquipmentAvailability(equipment._id);
      setBookedSlots(slots);
    } catch (e: any) {
      setError('Could not load availability');
    } finally {
      setLoading(false);
    }
  };

  // Check if a date has any booking overlap
  const isDateBooked = (date: Date): boolean => {
    return bookedSlots.some(slot => {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      return slotStart < dayEnd && slotEnd > dayStart;
    });
  };

  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedStart) return false;
    if (selectedEnd) {
      return date >= selectedStart && date <= selectedEnd;
    }
    return date.toDateString() === selectedStart.toDateString();
  };

  const isDateStart = (date: Date): boolean =>
    selectedStart ? date.toDateString() === selectedStart.toDateString() : false;

  const isDateEnd = (date: Date): boolean =>
    selectedEnd ? date.toDateString() === selectedEnd.toDateString() : false;

  const handleDateClick = (date: Date) => {
    if (isDateBooked(date) || isDateInPast(date)) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // Start fresh selection
      setSelectedStart(date);
      setSelectedEnd(null);
    } else {
      // Set end date
      if (date < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
    }
  };

  // Build calendar days for current month
  const buildCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const calendarDays = buildCalendarDays();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleConfirm = () => {
    if (!selectedStart) {
      setError('Please select a start date');
      return;
    }
    const endDate = selectedEnd || selectedStart;

    const start = new Date(selectedStart);
    const [sh, sm] = startTime.split(':');
    start.setHours(parseInt(sh), parseInt(sm), 0, 0);

    const end = new Date(endDate);
    const [eh, em] = endTime.split(':');
    end.setHours(parseInt(eh), parseInt(em), 0, 0);

    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    onBook(equipment, start.toISOString(), end.toISOString());
    onClose();
  };

  const estimatedPrice = () => {
    if (!selectedStart) return null;
    const endDate = selectedEnd || selectedStart;
    const start = new Date(selectedStart);
    const [sh, sm] = startTime.split(':');
    start.setHours(parseInt(sh), parseInt(sm));
    const end = new Date(endDate);
    const [eh, em] = endTime.split(':');
    end.setHours(parseInt(eh), parseInt(em));
    if (end <= start) return null;
    const hours = (end.getTime() - start.getTime()) / 3600000;
    return (hours * equipment.price_per_hour).toFixed(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <EquipmentImage
              src={equipment.image_url}
              alt={equipment.name}
              type={equipment.type}
              className="h-12 w-16 rounded-lg object-cover"
            />
            <div>
              <h2 className="font-bold text-foreground">{equipment.name}</h2>
              <p className="text-sm text-primary font-semibold">₹{equipment.price_per_hour}/hour</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-3 w-3" /></button>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-red-400 inline-block" /> Booked
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-primary inline-block" /> Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-green-400 inline-block" /> Available
            </span>
          </div>

          {/* Calendar */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading availability...</div>
          ) : (
            <div>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  ←
                </button>
                <h3 className="font-semibold text-foreground">{monthName}</h3>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  →
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, idx) => {
                  if (!date) return <div key={idx} />;
                  const booked = isDateBooked(date);
                  const past = isDateInPast(date);
                  const selected = isDateSelected(date);
                  const isStart = isDateStart(date);
                  const isEnd = isDateEnd(date);

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDateClick(date)}
                      disabled={booked || past}
                      className={`
                        h-9 w-full rounded-lg text-sm font-medium transition-all duration-150
                        ${past ? 'text-muted-foreground/30 cursor-not-allowed' : ''}
                        ${booked ? 'bg-red-100 text-red-400 cursor-not-allowed line-through' : ''}
                        ${selected && !booked && !past ? 'bg-primary/20 text-primary' : ''}
                        ${(isStart || isEnd) && !booked ? 'bg-primary text-primary-foreground shadow-md scale-105' : ''}
                        ${!booked && !past && !selected ? 'hover:bg-green-100 hover:text-green-700 text-foreground' : ''}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Selection */}
          {selectedStart && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-3">
              <p className="text-sm font-medium text-foreground">
                Selected: {selectedStart.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                {selectedEnd && selectedEnd.toDateString() !== selectedStart.toDateString() &&
                  ` → ${selectedEnd.toLocaleDateString('en-IN', { dateStyle: 'medium' })}`
                }
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Estimated Price */}
              {estimatedPrice() && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm text-muted-foreground">Estimated Total</span>
                  <span className="text-lg font-bold text-green-700 flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />{estimatedPrice()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={!selectedStart}
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
// ── CATEGORY SCREEN ──────────────────────────────────────────────────
const CategoryScreen: React.FC<{
  onSelect: (category: string, label: string) => void;
  equipment: Equipment[];
}> = ({ onSelect, equipment }) => {
  const getCount = (value: string) => {
    if (!value) return equipment.length;
    return equipment.filter(e => e.type === value).length;
  };

  const dynamicTypes = [...new Set(equipment.map(e => e.type))];
  const knownValues = categories.map(c => c.value).filter(Boolean);
  const extraCategories = dynamicTypes
    .filter(type => !knownValues.includes(type))
    .map(type => ({
      label: type,
      value: type,
      icon: Package,
      color: 'bg-purple-500/10 text-purple-600',
      border: 'hover:border-purple-400',
    }));

  const allCategories = [...categories, ...extraCategories];

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">What are you looking for?</h2>
        <p className="text-muted-foreground">Select a category to browse equipment</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allCategories.map((cat) => {
          const count = getCount(cat.value);
          if (count === 0 && cat.value !== '') return null;
          return (
            <button
              key={cat.value}
              onClick={() => onSelect(cat.value, cat.label)}
              className={`group rounded-2xl border-2 border-border ${cat.border} bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden`}
            >
              {/* Category Image */}
              <div className="w-full h-32 overflow-hidden">
                <img
                  src={cat.value ? CATEGORY_IMAGES[cat.value] || DEFAULT_IMAGE : DEFAULT_IMAGE}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                />
              </div>
              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-8 w-8 rounded-lg ${cat.color} flex items-center justify-center`}>
                    <cat.icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-foreground">{cat.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{count} available</p>
                <div className="mt-2 flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Browse <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

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
  const [popupEquipment, setPopupEquipment] = useState<Equipment | null>(null);

  // Category and search state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortPrice, setSortPrice] = useState('');

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

  const equipmentTypes = [...new Set(equipment.map(e => e.type))];

  const filteredEquipment = equipment
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType ? item.type === filterType : true;
      const matchesCategory = selectedCategory !== null && selectedCategory !== ''
        ? item.type === selectedCategory : true;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortPrice === 'asc') return a.price_per_hour - b.price_per_hour;
      if (sortPrice === 'desc') return b.price_per_hour - a.price_per_hour;
      return 0;
    });

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

  // Show category screen first
  if (selectedCategory === null) {
    return (
      <CategoryScreen
        equipment={equipment}
        onSelect={(value, label) => {
          setSelectedCategory(value);
          setSelectedCategoryLabel(label);
        }}
      />
    );
  }

  return (
    <div>
      {/* Availability Popup */}
      {popupEquipment && (
        <AvailabilityPopup
          equipment={popupEquipment}
          onClose={() => setPopupEquipment(null)}
          onBook={async (equipment, start, end) => {
            try {
              setError(null);
              await createBooking(userId, {
                equipment_id: equipment._id,
                start_time: start,
                end_time: end,
              });
              setSuccess(`✅ ${equipment.name} booked successfully!`);
              await loadData();
              setTimeout(() => setSuccess(null), 4000);
            } catch (e: any) {
              setError(e.message);
            }
          }}
        />
      )}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Back to categories */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedCategory(null);
            setFilterType('');
            setSearchQuery('');
            setSortPrice('');
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> All Categories
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{selectedCategoryLabel}</h2>
          <p className="text-sm text-muted-foreground">{filteredEquipment.length} equipment available</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
  <div className="space-y-6">
          {/* Equipment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Available Equipment</CardTitle>
              <CardDescription>Search and filter to find the right equipment</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Bar */}
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">All Types</option>
                  {equipmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  value={sortPrice}
                  onChange={(e) => setSortPrice(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Sort by Price</option>
                  <option value="asc">Price: Low to High</option>
                  <option value="desc">Price: High to Low</option>
                </select>

                {(searchQuery || filterType || sortPrice) && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchQuery('');
                    setFilterType('');
                    setSortPrice('');
                  }}>
                    Clear
                  </Button>
                )}
              </div>

              {(searchQuery || filterType || sortPrice) && (
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {filteredEquipment.length} of {equipment.length} equipment
                </p>
              )}

              {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading equipment...</div>
              ) : filteredEquipment.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchQuery || filterType ? 'No equipment matches your search.' : 'No equipment available yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEquipment.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => setPopupEquipment(item)}
                      className={`rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg ${
                        popupEquipment?._id === item._id
                          ? 'border-primary shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <EquipmentImage src={item.image_url} alt={item.name} type={item.type} className="..." />
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

          {/* Bookings Card */}
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
                        alt={booking.equipment_name} 
                        className="..." 
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

      {/* Vendor Bookings */}
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
