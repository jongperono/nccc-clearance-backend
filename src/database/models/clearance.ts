import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';
import Company from './company';
import Branch from './branch';
import Department from './department';
import Employee from './employee';
import ClearanceSignatory from './clearanceSignatory';

interface ClearanceAttributes {
    id?: number;
    tracking_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    company_id: string;
    branch_id: string;
    department_id: string;
    purpose: string;
    assigned_by: number;
    clearance_status: 'pending' | 'in progress' | 'approved' | 'cleared';
    cleared_by: number;
    id_number?: string;
    effectivity_date?: string;
    immediate_head?: string;
    position?: string;
}

interface ClearanceInstance
    extends Model<ClearanceAttributes>,
    ClearanceAttributes {
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

const Clearance = sequelize.define<ClearanceInstance>(
    'Clearance',
    {
        id: {
            allowNull: false,
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        tracking_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            unique: true,
            // set default value as 6 characters long uuid
            defaultValue: () => {
                return 'CL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            }
        },
        first_name: {
            allowNull: false,
            type: DataTypes.STRING(64),
        },
        middle_name: {
            allowNull: true,
            type: DataTypes.STRING(64),
        },
        last_name: {
            allowNull: false,
            type: DataTypes.STRING(64),
        },
        email: {
            allowNull: false,
            type: DataTypes.STRING(128),
            validate: {
                isEmail: true,
            },
        },
        company_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            references: {
                model: 'companies',
                key: 'company_id',
            },
        },
        branch_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            references: {
                model: 'branches',
                key: 'branch_id',
            },
        },
        department_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            references: {
                model: 'departments',
                key: 'department_id',
            },
        },
        purpose: {
            allowNull: false,
            type: DataTypes.STRING(128),
        },
        assigned_by: {
            allowNull: true,
            type: DataTypes.BIGINT,
            references: {
                model: 'employees',
                key: 'employee_id',
            },
        },
        clearance_status: {
            allowNull: false,
            type: DataTypes.STRING(32),
            defaultValue: 'pending',
        },
        cleared_by: {
            allowNull: true,
            type: DataTypes.BIGINT,
            references: {
                model: 'employees',
                key: 'employee_id',
            },
        },
        id_number: {
            allowNull: true,
            type: DataTypes.STRING(32),
        },
        effectivity_date: {
            allowNull: true,
            type: DataTypes.DATEONLY,
        },
        immediate_head: {
            allowNull: true,
            type: DataTypes.STRING(128),
        },
        position: {
            allowNull: true,
            type: DataTypes.STRING(128),
        },
    },
    {
        paranoid: true,
        tableName: 'clearances',
    },
);

// Define associations
Clearance.belongsTo(Company, { foreignKey: 'company_id' });
Clearance.belongsTo(Branch, { foreignKey: 'branch_id' });
Clearance.belongsTo(Department, { foreignKey: 'department_id' });
Clearance.belongsTo(Employee, { foreignKey: 'assigned_by', as: 'assigner' });
Clearance.hasMany(ClearanceSignatory, { foreignKey: 'clearance_id', as: 'signatories' });
ClearanceSignatory.belongsTo(Clearance, { foreignKey: 'clearance_id' });
ClearanceSignatory.belongsTo(Employee, { foreignKey: 'signatory_id' }); // keep this here

console.log('🔍 CLEARANCE MODEL DEBUG:');
console.log('  Attributes:', Object.keys(Clearance.rawAttributes));
console.log('  Has id_number?', 'id_number' in Clearance.rawAttributes);
console.log('  Has position?', 'position' in Clearance.rawAttributes);
console.log('  Has effectivity_date?', 'effectivity_date' in Clearance.rawAttributes);
console.log('  Has immediate_head?', 'immediate_head' in Clearance.rawAttributes);
console.log('  Table name:', Clearance.tableName);

export default Clearance;
