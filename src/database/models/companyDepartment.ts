import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';
import Department from './department';
import Company from './company';

interface CompanyDepartmentAttributes {
  company_id: string;
  department_id: string;
}

interface CompanyDepartmentInstance
  extends Model<CompanyDepartmentAttributes>,
    CompanyDepartmentAttributes {
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  Department: typeof Department;
  company: typeof Company;
}

const CompanyDepartment = sequelize.define<CompanyDepartmentInstance>(
  'CompanyDepartment',
  {
    company_id: {
      allowNull: false,
      type: DataTypes.STRING(32),
      primaryKey: true,
      references: {
        model: 'companies',
        key: 'company_id',
      },
    },
    department_id: {
      allowNull: false,
      type: DataTypes.STRING(32),
      primaryKey: true,
      references: {
        model: 'departments',
        key: 'department_id',
      },
    },
  },
  {
    paranoid: true,
    tableName: 'company_departments',
    timestamps: true,
  },
);

// Define associations
Company.hasMany(CompanyDepartment, { foreignKey: 'company_id', as: 'company_departments' });
CompanyDepartment.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
CompanyDepartment.belongsTo(Department, { foreignKey: 'department_id', as: 'Department' });

export default CompanyDepartment;
export { CompanyDepartmentInstance };