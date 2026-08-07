import Employee from './models/employee';
import Remark from './models/remark';
import Template from './models/template';
import TemplateSignatory from './models/templateSignatory';
import Role from './models/role';
import Branch from './models/branch';
import Department from './models/department';
import Company from './models/company';
import CompanyDepartment from './models/companyDepartment';
import ClearanceRequest from './models/clearance';
import ClearanceSignatory from './models/clearanceSignatory'; // <-- add this import

export default async function initializeDatabase(
    forceDropDB = false,
    forceAlterDB = false,
) {
    // sync models, DANGER: setting force to 'TRUE' will delete the tables!!!
    await Role.sync({ force: forceDropDB, alter: forceAlterDB });
    await Branch.sync({ force: forceDropDB, alter: forceAlterDB });
    await Company.sync({ force: forceDropDB, alter: forceAlterDB });
    await Department.sync({ force: forceDropDB, alter: forceAlterDB });
    await Employee.sync({ force: forceDropDB, alter: forceAlterDB });

    await Template.sync({ force: forceDropDB, alter: forceAlterDB });
    await ClearanceRequest.sync({ force: forceDropDB, alter: forceAlterDB });
    await Remark.sync({ force: false, alter: true });
    // associations
    await CompanyDepartment.sync({ force: forceDropDB, alter: forceAlterDB });
    await TemplateSignatory.sync({ force: forceDropDB, alter: forceAlterDB });
    await ClearanceSignatory.sync({ force: forceDropDB, alter: forceAlterDB }); // <-- add this line
}
