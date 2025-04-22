import { homestayApi } from './api';

export const getHomestays = async () => {
  const response = await homestayApi.get('/homestays');
  return response.data;
};

export const getHomestay = async (id) => {
  const response = await homestayApi.get(`/homestays/${id}`);
  return response.data;
};

export const createHomestay = async (data) => {
  const response = await homestayApi.post('/homestays', data);
  return response.data;
};