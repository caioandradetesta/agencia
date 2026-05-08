import axios from 'axios';

// Usamos a URL base dependendo do ambiente
// No Dokploy, o backend e o frontend estarão no mesmo host/porta
const API_URL = import.meta.env.PROD 
  ? '' 
  : 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar o token JWT em todas as chamadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agencia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
