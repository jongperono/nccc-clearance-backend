import {DataTypes, Model} from 'sequelize';
import sequelize from '../database';

interface CompanyAttributes {
    company_id: string;
    company_name: string;
}

interface CompanyInstance extends Model<CompanyAttributes>, CompanyAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const Company = sequelize.define<CompanyInstance>(
    'Company',
    {
        company_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            unique: true,
        },
        company_name: {
            allowNull: false,
            type: DataTypes.STRING(64),
            unique: true,
        },
    },
    {
        paranoid: true,
        tableName: 'companies',
    },
);

export default Company;
