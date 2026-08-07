import {DataTypes, Model} from 'sequelize';
import sequelize from '../database';

interface DepartmentAttributes {
    department_id: string;
    department_name: string;
    description: string;
}

interface DepartmentInstance
    extends Model<DepartmentAttributes>,
        DepartmentAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const Department = sequelize.define<DepartmentInstance>(
    'Department',
    {
        department_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            unique: true,
        },
        department_name: {
            allowNull: false,
            type: DataTypes.STRING(64),
            unique: true,
        },
        description: {
            allowNull: true,
            type: DataTypes.STRING(255),
        },
    },
    {
        paranoid: true,
        tableName: 'departments',
    },
);

export default Department;
