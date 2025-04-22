import { bookingApi } from './api';

export const getBookings = async (userId) => {
  const response = await bookingApi.get(`/bookings?user_id=${userId}`);
  return response.data;
};

export const createBooking = async (data) => {
  const response = await bookingApi.post('/bookings', data);
  return response.data;
};

export const updateBooking = async (id, data) => {
  const response = await bookingApi.put(`/bookings/${id}`, data);
  return response.data;
};