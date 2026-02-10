const API_URL =https://plantio-backend.onrender.com

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const api = {
  async register(data: RegisterData) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Erro ao registrar');
    }
    
    return response.json();
  },

  async login(data: LoginData) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Erro ao fazer login');
    }
    
    return response.json();
  },

  async createOffer(data: any, token: string) {
    const response = await fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Erro ao criar oferta');
    }
    
    return response.json();
  },

  async getOffers(token: string) {
    const response = await fetch(`${API_URL}/api/offers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar ofertas');
    }
    
    return response.json();
  }
};
