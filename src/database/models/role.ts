import {DataTypes, Model} from 'sequelize';
import sequelize from '../database';

interface RoleAttributes {
    role_id: string;
    role_name: string;
    description: string;
}

interface RoleInstance extends Model<RoleAttributes>, RoleAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const Role = sequelize.define<RoleInstance>(
    'Role',
    {
        role_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            unique: true,
        },
        role_name: {
            allowNull: false,
            type: DataTypes.STRING(64),
        },
        description: {
            allowNull: true,
            type: DataTypes.STRING(255),
        },
    },
    {
        paranoid: true,
        tableName: 'roles',
    },
);

export default Role;
