export interface ApiResponse<T> {
    status: number;
    message?: string;
    data?: T;
}

export interface ErrorResponse {
    status: number;
    message: string;
}