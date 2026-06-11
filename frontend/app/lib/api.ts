import axios, { AxiosError, AxiosInstance } from "axios";
import { ApiResponse, ErrorResponse } from "./responses";
import { AuthData, FavoriteItem, PredictionData, SentimentData, StockData, User } from "./types";

class BackendAPI {
    private client: AxiosInstance;
    private baseURL: string;

    constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL: `${this.baseURL}/api/v1.0`,
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            }
        });

        this.client.interceptors.request.use((config) => {
            const token = typeof window !== "undefined"
                ? localStorage.getItem("auth_token")
                : null;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    private handleError(error: AxiosError): ErrorResponse {
        if(error.response) {
            return {
                status: error.response.status,
                message: (error.response.data as any)?.message || `Server responded with status ${error.response.status}`
            }
        } else if(error.request) {
            return {
                status: 503,
                message: "No response from server. Please try again later."
            }
        } else {
            return {
                status: 500,
                message: error.message || "An unexpected error occurred."
            }
        }
    }

    async fetchStockData(symbol: string, n_days: number = 30): Promise<StockData[] | ErrorResponse> {
        try {
            const response = await this.client.get<ApiResponse<any[]>>("/fetch/stock", {
                params: {symbol, n_days}
            })
            
            if(response.data.status === 200 && Array.isArray(response.data.data)) {
                const stockData: StockData[] = response.data.data.map((i: any) => ({
                    Date: i.Date,
                    Open: i.Open,
                    High: i.High,
                    Low: i.Low,
                    Close: i.Close,
                    Volume: i.Volume
                }))

                return stockData;
            } else {
                return {
                    status: response.data.status,
                    message: response.data.message || "Failed to fetch stock data."
                }
            }
        } catch(error) {
            return this.handleError(error as AxiosError);
        }
    }

    async fetchSentimentData(symbol: string, n_news: number = 20): Promise<SentimentData | ErrorResponse> {
        try {
            const response = await this.client.get<ApiResponse<any>>("/fetch/sentiment", {
                params: {symbol, n_news}
            })

            if(response.data.status === 200 && response.data.data) {
                const data = response.data.data;
                const sentimentData: SentimentData = {
                    positive: data.positive || 0,
                    negative: data.negative || 0,
                    neutral: data.neutral || 0,
                    overall: data.overall || 0
                }

                return sentimentData;
            } else {
                return {
                    status: response.data.status,
                    message: response.data.message || "Failed to fetch sentiment data."
                }
            }
        } catch(error) {
            return this.handleError(error as AxiosError);
        }
    }

    async fetchPredictionData(
        symbol: string,
        model: "lstm" | "qlstm" = "lstm",
    ): Promise<PredictionData | ErrorResponse> {
        try {
            const response = await this.client.get<ApiResponse<any>>("/predict", {
                params: {symbol, model}
            })

            if(response.data.status === 200 && response.data.data) {
                const data = response.data.data;
                const predictionData: PredictionData = {
                    open: data.open || 0,
                    high: data.high || 0,
                    low: data.low || 0,
                    close: data.close || 0
                }

                return predictionData;
            } else {
                return {
                    status: response.data.status,
                    message: response.data.message || "Failed to fetch prediction data."
                }
            }
        } catch(error) {
            return this.handleError(error as AxiosError);
        }
    }

    async register(username: string, email: string, password: string): Promise<AuthData | ErrorResponse> {
        try {
            const response = await this.client.post<ApiResponse<AuthData>>("/auth/register", {
                username, email, password,
            });
            if (response.data.status === 200 && response.data.data) {
                return response.data.data;
            }
            return { status: response.data.status, message: response.data.message || "Registration failed." };
        } catch (error) {
            return this.handleError(error as AxiosError);
        }
    }

    async login(username: string, password: string): Promise<AuthData | ErrorResponse> {
        try {
            const response = await this.client.post<ApiResponse<AuthData>>("/auth/login", {
                username, password,
            });
            if (response.data.status === 200 && response.data.data) {
                return response.data.data;
            }
            return { status: response.data.status, message: response.data.message || "Login failed." };
        } catch (error) {
            return this.handleError(error as AxiosError);
        }
    }

    async getMe(): Promise<User | ErrorResponse> {
        try {
            const response = await this.client.get<ApiResponse<User>>("/auth/me");
            if (response.data.status === 200 && response.data.data) {
                return response.data.data;
            }
            return { status: response.data.status, message: response.data.message || "Auth check failed." };
        } catch (error) {
            return this.handleError(error as AxiosError);
        }
    }

    async getFavorites(): Promise<FavoriteItem[] | ErrorResponse> {
        try {
            const response = await this.client.get<ApiResponse<FavoriteItem[]>>("/favorites/");
            if (response.data.status === 200 && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return { status: response.data.status, message: response.data.message || "Failed to load favorites." };
        } catch (error) {
            return this.handleError(error as AxiosError);
        }
    }

    async addFavorite(symbol: string): Promise<FavoriteItem | ErrorResponse> {
        try {
            const response = await this.client.post<ApiResponse<FavoriteItem>>("/favorites/", { symbol });
            if (response.data.status === 200 && response.data.data) {
                return response.data.data;
            }
            return { status: response.data.status, message: response.data.message || "Failed to add favorite." };
        } catch (error) {
            return this.handleError(error as AxiosError);
        }
    }

    async removeFavorite(symbol: string): Promise<{ deleted: boolean; symbol: string } | ErrorResponse> {
        try {
            const response = await this.client.delete<ApiResponse<any>>(`/favorites/${symbol}`);
            if (response.data.status === 200 && response.data.data) {
                return response.data.data;
            }
            return { status: response.data.status, message: response.data.message || "Failed to remove favorite." };
        } catch (error) {
            return this.handleError(error as AxiosError);
        }
    }

    async isFavorited(symbol: string): Promise<boolean> {
        const result = await this.getFavorites();
        if (this.isError(result)) return false;
        return result.some((f) => f.symbol === symbol.toUpperCase());
    }

    isError(response: any): response is ErrorResponse {
        return 'status' in response && response.status >= 400;
    }
}

export { BackendAPI };
export const api = new BackendAPI();
