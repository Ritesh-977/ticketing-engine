declare namespace Express {
    export interface Request {
        tenantId?: string;
        tenant?: {
            id: string;
            name?: string;
        };
    }
}