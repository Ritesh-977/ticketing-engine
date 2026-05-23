declare namespace Express {
    export interface Request {
        tenant?: {
            id: string;
            name: string;
        };
    }
}