export interface StockData {
    Date: string;
    Open: number | null;
    High: number | null;
    Low: number | null;
    Close: number | null;
    Volume: number | null;
}

export interface PredictionData {
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface SentimentData {
    positive: number;
    negative: number;
    neutral: number;
    overall: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
}

export interface AuthData {
    token: string;
    user: User;
}

export interface FavoriteItem {
    id: number;
    symbol: string;
    created_at: string;
}
