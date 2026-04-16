import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9100/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Interceptor to add Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');
  const finalToken = token || sessionToken;
  
  if (finalToken) {
    config.headers.Authorization = `Bearer ${finalToken}`;
  }
  return config;
});

// Interceptor to handle 401 responses (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/login', data),
  me: () => api.get('/user'),
  logout: () => api.post('/logout'),
};

// ─── WhatsApp Instances API ──────────────────────────────────────────────────
export const whatsappApi = {
  getInstances: () => api.get('/whatsapp-instances'),
  createInstance: (name: string) => api.post('/whatsapp-instances', { name }),
  getInstance: (id: number) => api.get(`/whatsapp-instances/${id}`),
  getGroups: (id: number) => api.get(`/whatsapp-instances/${id}/groups`),
  getQrCode: (id: number) => api.post(`/whatsapp-instances/${id}/connect`),
  getPairingCode: (id: number, phone: string) => api.post(`/whatsapp-instances/${id}/pairing-code`, { phone }),
  updateInstance: (id: number, data: { daily_limit?: number }) => api.put(`/whatsapp-instances/${id}`, data),
  deleteInstance: (id: number) => api.delete(`/whatsapp-instances/${id}`),
};

// ─── Contacts API ────────────────────────────────────────────────────────────
export const contactApi = {
  getContacts: (page = 1, search = '', tag = '') => api.get(`/contacts?page=${page}&search=${search}&tag=${tag}`),
  createContact: (data: { name?: string; phone: string; tags?: string[] }) => api.post('/contacts', data),
  bulkImport: (contacts: { name?: string; phone: string }[]) => api.post('/contacts/bulk', { contacts }),
  importGoogleSheet: (url: string) => api.post('/contacts/google-sheets', { url }),
  deleteContact: (id: number) => api.delete(`/contacts/${id}`),
};

// ─── Campaigns API ───────────────────────────────────────────────────────────
export const campaignApi = {
  getCampaigns: () => api.get('/campaigns'),
  getStats: () => api.get('/campaigns/stats'),
  createCampaign: (data: Record<string, unknown>) => api.post('/campaigns', data),
  getCampaign: (id: number) => api.get(`/campaigns/${id}`),
  getLogs: (id: number) => api.get(`/campaigns/${id}/logs`),
  deleteCampaign: (id: number) => api.delete(`/campaigns/${id}`),
};

// ─── Templates API ───────────────────────────────────────────────────────────
export const templateApi = {
  getTemplates: () => api.get('/templates'),
  createTemplate: (data: Record<string, unknown>) => api.post('/templates', data),
  updateTemplate: (id: number, data: Record<string, unknown>) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id: number) => api.delete(`/templates/${id}`),
};

// ─── Channel API ─────────────────────────────────────────────────────────────
export const channelApi = {
  getChannels: () => api.get('/channels'),
  detect: (instanceId: number) => api.post(`/channels/detect/${instanceId}`),
  create: (data: { instance_id: number; name: string; description?: string }) => api.post('/channels', data),
  getChannel: (id: number) => api.get(`/channels/${id}`),
  publish: (data: { channel_ids: number[]; content: string; content_type?: string; mediaURLs?: string[]; scheduled_at?: string }) => api.post('/channels/publish', data),
  delete: (id: number) => api.delete(`/channels/${id}`),
};

// ─── User Settings & API Keys ────────────────────────────────────────────────
export const userApi = {
  getKeys: () => api.get('/api-keys'),
  createKey: (name: string) => api.post('/api-keys', { name }),
  deleteKey: (id: number) => api.delete(`/api-keys/${id}`),
};

// ─── Super Admin ─────────────────────────────────────────────────────────────
export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
};

// ─── Media API ───────────────────────────────────────────────────────────────
export const mediaApi = {
  upload: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;
