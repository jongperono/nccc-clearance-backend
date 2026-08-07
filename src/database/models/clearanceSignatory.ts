import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';
import Employee from './employee'; // Use Employee instead of Signatory

interface ClearanceSignatoryAttributes {
    clearance_id: number;
    signatory_id: number;
    is_approved?: boolean;
    date_approved?: Date;
}
interface ClearanceSignatoryInstance
    extends Model<ClearanceSignatoryAttributes>,
        ClearanceSignatoryAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const ClearanceSignatory = sequelize.define<ClearanceSignatoryInstance>(
    'ClearanceSignatory',
    {
        clearance_id: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
                model: 'clearances',
                key: 'id',
            },
            primaryKey: true,
        },
        signatory_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            references: {
                model: 'employees',
                key: 'employee_id',
            },
            primaryKey: true,
        },
        is_approved: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        date_approved: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'clearance_signatories',
        indexes: [
            {
                unique: true,
                fields: ['clearance_id', 'signatory_id'],
            },
        ],
    },
);

// Associations
ClearanceSignatory.belongsTo(Employee, { foreignKey: 'signatory_id' }); // signatory_id refers to Employee

export default ClearanceSignatory;