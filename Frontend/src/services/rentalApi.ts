/**
 * Rental API Service
 * Handles all API calls for the Equipment Rental feature
 * Connects to FastAPI backend at /api/rental/*
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Temporary user ID for demo — replace with real auth later
const TEMP_USER_ID = 'farmer_demo_user_001';

export interface Equipment {
  _id: string;
  name: string;
  type: string;
  price_per_hour: number;
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
}

export interface BookingCreatePayload {
  equipment_id: string;
  start_time: string;
  end_time: string;
}

/** Fetch all available equipment */
export async function getAllEquipment(): Promise<Equipment[]> {
  const response = await fetch(`${API_BASE_URL}/api/rental/equipment`, {
    headers: { 'X-User-Id': TEMP_USER_ID },
  });
  if (!response.ok) throw new Error('Failed to fetch equipment');
  const data = await response.json();
  return data.data;
}

/** Create a new booking */
export async function createBooking(payload: BookingCreatePayload): Promise<Booking> {
  const response = await fetch(`${API_BASE_URL}/api/rental/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': TEMP_USER_ID,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to create booking');
  return data.data;
}

/** Get all active bookings for current user */
export async function getMyBookings(): Promise<Booking[]> {
  const response = await fetch(`${API_BASE_URL}/api/rental/bookings`, {
    headers: { 'X-User-Id': TEMP_USER_ID },
  });
  if (!response.ok) throw new Error('Failed to fetch bookings');
  const data = await response.json();
  return data.data;
}

/** Cancel a booking */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  const response = await fetch(`${API_BASE_URL}/api/rental/book/${bookingId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': TEMP_USER_ID },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to cancel booking');
  return data.data;
}