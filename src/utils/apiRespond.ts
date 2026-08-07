import {Response} from 'express';

interface responseData {
    status: number;
    success: boolean;
    message: string;
    data?: unknown;
    token?: string;
}

export function apiRespond(res: Response, data: responseData) {
    res.status(data.status).send({data});
}
