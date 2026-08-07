import {Express, Request, Response} from 'express';
import morgan from 'morgan';
import colors from 'colors/safe';

export const setupLogger = (app: Express): void => {
    // Define custom tokens for morgan logger
    morgan.token('hostname', (req: Request) => {
        return req.hostname || '';
    });

    morgan.token('colored-status', (req: Request, res: Response) => {
        const status = res.statusCode;

        if (status >= 500) {
            return colors.red(status.toString());
        } else if (status >= 400) {
            return colors.yellow(status.toString());
        } else if (status >= 300) {
            return colors.cyan(status.toString());
        } else if (status >= 200) {
            return colors.green(status.toString());
        } else {
            return colors.white(status.toString());
        }
    });

    morgan.token('colored-method', (req: Request) => {
        const method = req.method;
        if (!method) return colors.white('UNKNOWN');

        switch (method) {
            case 'GET':
                return colors.blue(method);
            case 'POST':
                return colors.green(method);
            case 'PUT':
                return colors.yellow(method);
            case 'DELETE':
                return colors.red(method);
            default:
                return colors.white(method);
        }
    });

    // Added new tokens for better information
    morgan.token('user-agent', (req: Request) => {
        return req.headers['user-agent'] || 'unknown';
    });

    morgan.token('ip', (req: Request) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return colors.grey(ip);
    });

    morgan.token('request-body', (req: Request) => {
        if (req.method === 'POST' || req.method === 'PUT') {
            const body = JSON.stringify(req.body);
            if (body.length < 100) {
                return colors.grey(body);
            } else {
                return colors.grey(`${body.substring(0, 100)}...`);
            }
        }
        return '';
    });

    morgan.token('request-params', (req: Request) => {
        const params = JSON.stringify(req.params);
        return params.length < 100
            ? colors.grey(params)
            : colors.grey(`${params.substring(0, 100)}...`);
    });

    morgan.token('request-query', (req: Request) => {
        const query = JSON.stringify(req.query);
        return query.length < 100
            ? colors.grey(query)
            : colors.grey(`${query.substring(0, 100)}...`);
    });

    const logFormat =
        ':ip :colored-status :colored-method :url - :hostname :res[content-length] - :response-time ms - :date[web]';

    const debugFormat = `${logFormat}\nUser-Agent: :user-agent\nBody: :request-body\nParams: :request-params\nQuery: :request-query`;

    app.use(
        morgan(
            process.env.NODE_ENV === 'development' ? debugFormat : logFormat,
        ),
    );

    console.log(colors.cyan('Logger configured successfully'));
};
