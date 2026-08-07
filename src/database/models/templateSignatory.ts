import {DataTypes, Model} from 'sequelize';
import sequelize from '../database';
import Template from './template';
import Employee from './employee';

interface TemplateSignatoryAttributes {
    template_id: number;
    employee_id: number;
}

interface TemplateSignatoryInstance
    extends Model<TemplateSignatoryAttributes>,
        TemplateSignatoryAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const TemplateSignatory = sequelize.define<TemplateSignatoryInstance>(
    'TemplateSignatory',
    {
        template_id: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: {
                model: 'templates',
                key: 'template_id',
            },
        },
        employee_id: {
            allowNull: false,
            type: DataTypes.BIGINT,
            references: {
                model: 'employees',
                key: 'employee_id',
            },
        },
    },
    {
        tableName: 'template_signatories',
    },
);

Template.hasMany(TemplateSignatory, {foreignKey: 'template_id'});
TemplateSignatory.belongsTo(Template, {foreignKey: 'template_id'});

// Add association to Employee
TemplateSignatory.belongsTo(Employee, {foreignKey: 'employee_id', as: 'employee'});

export default TemplateSignatory;
