import {DataTypes, Model} from 'sequelize';
import sequelize from '../database';

interface BranchAttributes {
    branch_id: string;
    branch_name: string;
    location: string;
    contact_number: number;
}

interface BranchInstance extends Model<BranchAttributes>, BranchAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const Branch = sequelize.define<BranchInstance>(
    'Branch',
    {
        branch_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            unique: true,
        },
        branch_name: {
            allowNull: false,
            type: DataTypes.STRING(64),
            unique: true,
        },
        location: {
            allowNull: false,
            type: DataTypes.STRING(128),
        },
        contact_number: {
            allowNull: true,
            type: DataTypes.BIGINT,
        },
    },
    {
        paranoid: true,
        tableName: 'branches',
    },
);

export default Branch;
