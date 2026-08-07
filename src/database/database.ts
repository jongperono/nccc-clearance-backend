import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DIALECT = process.env.DB_DIALECT || 'mysql';

let sequelize: Sequelize;

if (DIALECT === 'sqlite') {
    const STORAGE = process.env.DB_SQLITE_STORAGE || 'database.sqlite';
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: STORAGE,
    });
} else {
    const HOST = process.env.DB_HOST;
    const PORT = Number(process.env.DB_PORT);
    const NAME = process.env.DB_NAME!;
    const USER = process.env.DB_USER!;
    const PASS = process.env.DB_PASS;
    sequelize = new Sequelize(NAME, USER, PASS, {
        host: HOST,
        port: PORT,
        dialect: 'mysql',
    });
}

export default sequelize;
