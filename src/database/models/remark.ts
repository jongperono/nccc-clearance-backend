import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';
import Employee from './employee';

interface RemarkAttributes {
    clearance_id: number;
    employee_id: number;
    remark: string;
}

interface RemarkInstance extends Model<RemarkAttributes>, RemarkAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const Remark = sequelize.define<RemarkInstance>(
    'Remark',
    {
        clearance_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clearances',
                key: 'id',
            },
        },
        employee_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'employees',
                key: 'employee_id',
            },
        },
        remark: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        tableName: 'remarks',
    },
);

Remark.belongsTo(Employee, { foreignKey: 'employee_id', as: 'Employee' });

export default Remark;
