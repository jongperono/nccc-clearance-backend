import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';
import Employee from './employee';

interface TemplateAttributes {
  template_id?: number;
  creator_employee_id: number;
  updater_employee_id: number;
  title: string;
  purpose: string;
  footer_message: string;
}

interface TemplateInstance
  extends Model<TemplateAttributes>,
    TemplateAttributes {
  createdAt?: Date;
  updatedAt?: Date;
  creator_employee: typeof Employee;
}

const Template = sequelize.define<TemplateInstance>(
  'Template',
  {
    template_id: {
      allowNull: false,
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    creator_employee_id: {
      allowNull: false,
      type: DataTypes.BIGINT,
      references: {
        model: 'employees',
        key: 'employee_id',
      },
    },
    updater_employee_id: {
      allowNull: true,
      type: DataTypes.BIGINT,
      references: {
        model: 'employees',
        key: 'employee_id',
      },
      defaultValue: 0,
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING(32),
    },
    purpose: {
      allowNull: false,
      type: DataTypes.STRING(32),
    },
    footer_message: {
      allowNull: true,
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'templates',
    paranoid: true,
  },
);

// Define associations
Template.belongsTo(Employee, { foreignKey: 'creator_employee_id', as: 'creator_employee' });

export default Template;
export { TemplateInstance };