"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (err: any) {
      console.error("API request failed:", err);
      return { error: err.message || "Network error" };
    }
  }

  // Auth endpoints
  async login(walletAddress: string) {
    const result = await this.request<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    });
    if (result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  // Markets endpoints
  async getMarkets() {
    return this.request<{ markets: any[] }>("/api/markets");
  }

  async getMarket(id: string) {
    return this.request<any>(`/api/markets/${id}`);
  }

  async createMarket(marketData: {
    marketId: string;
    question: string;
    description: string;
    category: string;
    endTimestamp: number;
    resolutionTimestamp: number;
    oracleSource: string;
  }) {
    return this.request<{ market: any }>("/api/markets", {
      method: "POST",
      body: JSON.stringify(marketData),
    });
  }

  // User endpoints
  async getAccount(address: string) {
    return this.request<{ user: any }>(`/api/accounts/${address}`);
  }

  async getProfile() {
    return this.request<{ user: any }>("/api/secure/profile");
  }

  // Orders endpoints
  async createOrder(orderData: {
    marketId: string;
    orderType: string;
    outcome: string;
    shares: number;
    price: number;
  }) {
    return this.request<{ order: any }>("/api/secure/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  // Positions endpoints
  async getPositions() {
    return this.request<{ positions: any[] }>("/api/secure/positions", {
      method: "POST",
    });
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>("/health");
  }

  // Leaderboard
  async getLeaderboard() {
    return this.request<{ traders: any[] }>("/api/leaderboard");
  }
}

export const api = new ApiService();
