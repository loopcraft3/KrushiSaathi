import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tractor, Calendar, Clock, IndianRupee, X, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getAllEquipment,
  getMyBookings,
  createBooking,
  cancelBooking,
  Equipment,
  Booking,
} from '@/services/rentalApi';

const EquipmentRental: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Booking form state
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Load equipment and bookings on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [equipmentData, bookingsData] = await Promise.all([
        getAllEquipment(),
        getMyBookings(),
      ]);
      setEquipment(equipmentData);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedEquipment || !startTime || !endTime) {
      setError('Please select equipment and both start and end times.');
      return;
    }
    try {
      setBookingLoading(true);
      setError(null);
      await createBooking({
        equipment_id: selectedEquipment._id,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      });
      setSuccessMsg(`✅ ${selectedEquipment.name} booked successfully!`);
      setSelectedEquipment(null);
      setStartTime('');
      setEndTime('');
      await loadData(); // refresh bookings
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      setError(null);
      await cancelBooking(bookingId);
      setSuccessMsg('Booking cancelled successfully.');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Calculate estimated price for the booking form
  const estimatedPrice = () => {
    if (!selectedEquipment || !startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) return null;
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return (hours * selectedEquipment.price_per_hour).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tractor className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Equipment Rental</h1>
            <p className="text-muted-foreground text-sm">Rent agricultural equipment by the hour</p>
          </div>
        </div>
      </div>

      {/* Error / Success Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — Equipment List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Available Equipment</CardTitle>
              <CardDescription>Click on equipment to book it</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading equipment...</div>
              ) : equipment.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No equipment available. Add some via the API.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipment.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => setSelectedEquipment(item)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedEquipment?._id === item._id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Tractor className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="secondary">{item.type}</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mt-2">{item.name}</h3>
                      <div className="flex items-center gap-1 text-primary font-bold mt-1">
                        <IndianRupee className="h-4 w-4" />
                        <span>{item.price_per_hour}/hour</span>
                      </div>
                      {selectedEquipment?._id === item._id && (
                        <p className="text-xs text-primary mt-2 font-medium">✓ Selected — fill the form →</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Active Bookings */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                My Active Bookings
              </CardTitle>
              <CardDescription>Your current rentals</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-6 text-muted-foreground">Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No active bookings. Book equipment from the list above.
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {booking.equipment_name || booking.equipment_id}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(booking.start_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          <span>→</span>
                          <span>{new Date(booking.end_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-primary mt-1">
                          <IndianRupee className="h-3 w-3" />
                          {booking.total_price}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Active</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleCancel(booking._id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Booking Form */}
        <div>
          <Card className="shadow-sm sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Book Equipment</CardTitle>
              <CardDescription>
                {selectedEquipment ? `Booking: ${selectedEquipment.name}` : 'Select equipment from the list'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Equipment */}
              {selectedEquipment ? (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{selectedEquipment.name}</p>
                    <p className="text-xs text-muted-foreground">₹{selectedEquipment.price_per_hour}/hour</p>
                  </div>
                  <button onClick={() => setSelectedEquipment(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/50 border border-dashed border-border text-center text-sm text-muted-foreground">
                  ← Select equipment from the list
                </div>
              )}

              {/* Start Time */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* End Time */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime || new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Estimated Price */}
              {estimatedPrice() && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-muted-foreground">Estimated Total</p>
                  <p className="text-xl font-bold text-green-700 flex items-center gap-1">
                    <IndianRupee className="h-5 w-5" />
                    {estimatedPrice()}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleBook}
                disabled={bookingLoading || !selectedEquipment || !startTime || !endTime}
              >
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Overlapping bookings are automatically rejected
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EquipmentRental;