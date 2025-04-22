import { roomApi } from './api';

export const getRooms = async (homestayId) => {
  const response = await roomApi.get(`/rooms?homestay_id=${homestayId}`);
  return response.data;
};

export const getRoom = async (id) => {
  const response = await roomApi.get(`/rooms/${id}`);
  return response.data;
};

export const getAvailability = async (id) => {
  const response = await roomApi.get(`/rooms/${id}/availability`);
  return response.data;
};

export const createRoom = async (data) => {
  const response = await roomApi.post('/rooms', data);
  return response.data;
};