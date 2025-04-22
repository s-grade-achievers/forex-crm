import axios from 'axios';

export const homestayApi = axios.create({ baseURL: 'http://localhost:5001' });
export const roomApi = axios.create({ baseURL: 'http://localhost:5002' });
export const bookingApi = axios.create({ baseURL: 'http://localhost:5003' });
export const hostApi = axios.create({ baseURL: 'http://localhost:5004' });