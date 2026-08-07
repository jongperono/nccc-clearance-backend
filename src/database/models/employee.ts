import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

interface EmployeeAttributes {
    employee_id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    full_name?: string;
    phone_number: number;
    email: string;
    password: string;
    generated_password?: string;
    company_id: string;
    role_id: string;
    branch_id: string;
    department_id: string;
    // whoever made the account
    account_creator: string;
    is_signatory: boolean;
    can_assign_clearances: boolean;
    can_create_roles: boolean;
    can_create_accounts: boolean;
    can_create_companies: boolean;
    can_create_departments: boolean;
    can_create_branches: boolean;
    can_create_templates: boolean;
    can_access_logs: boolean;
    can_access_all_clearances: boolean;
    can_create_clearance_requests: boolean;
    can_clear_clearances: boolean;
    can_add_signatory: boolean;
}

interface EmployeeInstance
    extends Model<EmployeeAttributes>,
        EmployeeAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const Employee = sequelize.define<EmployeeInstance>(
    'Employee',
    {
        employee_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            primaryKey: true,
            unique: true,
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
        full_name: {
            allowNull: true,
            type: DataTypes.VIRTUAL,
            get() {
                return `${this.first_name} ${this.middle_name || ''} ${this.last_name}`;
            },
            set(value) {
                throw new Error('Virtual value do not set!' + value);
            },
        },
        phone_number: {
            allowNull: false,
            type: DataTypes.BIGINT,
        },
        email: {
            allowNull: false,
            type: DataTypes.STRING(128),
            validate: {
                isEmail: true,
            },
        },
        password: {
            allowNull: false,
            type: DataTypes.STRING,
        },
        generated_password: {
            allowNull: true,
            type: DataTypes.STRING,
            defaultValue: 'N/A',
        },
        company_id: {
            allowNull: false,
            type: DataTypes.STRING(32),
            references: {
                model: 'companies',
                key: 'company_id',
            },
        },
        role_id: {
            allowNull: true,
            type: DataTypes.STRING(32),
            references: {
                model: 'roles',
                key: 'role_id',
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
        account_creator: {
            type: DataTypes.STRING,
            defaultValue: 'System',
        },
        is_signatory: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_assign_clearances: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_create_templates: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_create_roles: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_create_accounts: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_create_companies: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_create_departments: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_create_branches: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_access_logs: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_access_all_clearances: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_create_clearance_requests: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_clear_clearances: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_add_signatory: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        paranoid: true,
        tableName: 'employees',
        defaultScope: {
            attributes: { exclude: ['password'] },
        },
        scopes: {
            withPassword: {
            },
        },
    },
);

export default Employee;
