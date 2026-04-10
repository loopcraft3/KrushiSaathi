const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Equipment {
  _id: string;
  name: string;
  type: string;
  price_per_hour: number;
  vendor_id?: string;
  image_url?: string;
}

export interface Booking {
  _id: string;
  user_id: string;
  equipment_id: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'cancelled';
  total_price: number;
  equipment_name?: string;
  equipment_image?: string;
}

const headers = (userId: string) => ({ 'X-User-Id': userId });

// ── FARMER ──────────────────────────────────────────

export async function getAllEquipment(): Promise<Equipment[]> {
  const res = await fetch(`${API_BASE_URL}/api/rental/equipment`);
  if (!res.ok) throw new Error('Failed to fetch equipment');
  return (await res.json()).data;
}

export async function createBooking(userId: string, payload: {
  equipment_id: string; start_time: string; end_time: string;
}): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/rental/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers(userId) },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to create booking');
  return data.data;
}

export async function getMyBookings(userId: string): Promise<Booking[]> {
  const res = await fetch(`${API_BASE_URL}/api/rental/bookings`, { headers: headers(userId) });
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return (await res.json()).data;
}

export async function getBookingHistory(userId: string): Promise<Booking[]> {
  const res = await fetch(`${API_BASE_URL}/api/rental/bookings/history`, { headers: headers(userId) });
  if (!res.ok) throw new Error('Failed to fetch history');
  return (await res.json()).data;
}

export async function cancelBooking(userId: string, bookingId: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/rental/book/${bookingId}`, {
    method: 'DELETE',
    headers: headers(userId),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to cancel');
  return data.data;
}

// ── VENDOR ──────────────────────────────────────────

export async function getVendorEquipment(userId: string): Promise<Equipment[]> {
  const res = await fetch(`${API_BASE_URL}/api/rental/vendor/equipment`, { headers: headers(userId) });
  if (!res.ok) throw new Error('Failed to fetch vendor equipment');
  return (await res.json()).data;
}

export async function addEquipment(userId: string, formData: FormData): Promise<Equipment> {
  const res = await fetch(`${API_BASE_URL}/api/rental/vendor/equipment`, {
    method: 'POST',
    headers: headers(userId),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to add equipment');
  return data.data;
}

export async function updateEquipment(userId: string, equipmentId: string, formData: FormData): Promise<Equipment> {
  const res = await fetch(`${API_BASE_URL}/api/rental/vendor/equipment/${equipmentId}`, {
    method: 'PUT',
    headers: headers(userId),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update');
  return data.data;
}

export async function deleteEquipment(userId: string, equipmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/rental/vendor/equipment/${equipmentId}`, {
    method: 'DELETE',
    headers: headers(userId),
  });
  if (!res.ok) throw new Error('Failed to delete equipment');
}

export async function getVendorBookings(userId: string): Promise<Booking[]> {
  const res = await fetch(`${API_BASE_URL}/api/rental/vendor/bookings`, { headers: headers(userId) });
  if (!res.ok) throw new Error('Failed to fetch vendor bookings');
  return (await res.json()).data;
}

export interface BookedSlot {
  start_time: string;
  end_time: string;
}

export async function getEquipmentAvailability(equipmentId: string): Promise<BookedSlot[]> {
  const res = await fetch(`${API_BASE_URL}/api/rental/equipment/${equipmentId}/availability`);
  if (!res.ok) throw new Error('Failed to fetch availability');
  return (await res.json()).data;
}