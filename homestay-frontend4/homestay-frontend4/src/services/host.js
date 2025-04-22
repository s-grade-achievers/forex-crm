import { hostApi } from './api';

export const createHost = async (data) => {
  const response = await hostApi.post('/hosts', data);
  return response.data;
};

export const getHostHomestays = async (id) => {
  const response = await hostApi.get(`/hosts/${id}/homestays`);
  return response.data;
};

export const createHostHomestay = async (id, data) => {
  const response = await hostApi.post(`/hosts/${id}/homestays`, data);
  return response.data;
};

export const getHostBookings = async (id) => {
  const response = await hostApi.get(`/hosts/${id}/bookings`);
  return response.data;
};