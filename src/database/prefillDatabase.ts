import Role from './models/role';
import Branch from './models/branch';
import Department from './models/department';
import Employee from './models/employee';
import Company from './models/company';
import bcrypt from 'bcrypt';
import CompanyDepartment from './models/companyDepartment';

const prefillData = async () => {
    try {
        // Prefill role data
        const [role, createdRole] = await Role.findOrCreate({
            where: {role_id: process.env.SU_ROLE || 'IT'},
            defaults: {
                role_id: process.env.SU_ROLE || 'IT',
                role_name: 'Information Tech',
                description:
                    'Responsible for managing and supporting IT infrastructure and services',
            },
        });
        if (createdRole) {
            console.log(`Role created: ${role.role_name}`);
        } else {
            console.log(`Role already exists: ${role.role_name}`);
        }

        // Prefill department data
        const [department, createdDepartment] = await Department.findOrCreate({
            where: {department_id: process.env.SU_DEPARTMENT || 'ISD'},
            defaults: {
                department_id: process.env.SU_DEPARTMENT || 'ISD',
                department_name: 'Information Systems Division',
                description:
                    'Oversees the planning, implementation, and management of technology systems',
            },
        });
        if (createdDepartment) {
            console.log(`Department created: ${department.department_name}`);
        } else {
            console.log(
                `Department already exists: ${department.department_name}`,
            );
        }

        // Prefill branch data
        const [branch, createdBranch] = await Branch.findOrCreate({
            where: {branch_id: process.env.SU_BRANCH || 'NHQ'},
            defaults: {
                branch_id: process.env.SU_BRANCH || 'NHQ',
                branch_name: 'NCCC Headquarters',
                location:
                    'Bruno Gempesaw Street, Ext, Davao City, 8000 Davao del Sur',
                contact_number: 999,
            },
        });
        if (createdBranch) {
            console.log(`Branch created: ${branch.branch_name}`);
        } else {
            console.log(`Branch already exists: ${branch.branch_name}`);
        }

        // Prefill company data
        const [company, createdCompany] = await Company.findOrCreate({
            where: {company_id: 'LTSPH'},
            defaults: {
                company_id: 'LTSPH',
                company_name: 'LTS Pinnacle Holdings, Inc.',
            },
        });
        if (createdCompany) {
            console.log(`Company created: ${company.company_name}`);
        } else {
            console.log(`Company already exists: ${company.company_name}`);
        }

        // Prefill company-department data
        const [companyDepartment, createdCompanyDepartment] =
            await CompanyDepartment.findOrCreate({
                where: {
                    company_id: 'LTSPH',
                    department_id: process.env.SU_DEPARTMENT || 'ISD',
                },
                defaults: {
                    company_id: 'LTSPH',
                    department_id: process.env.SU_DEPARTMENT || 'ISD',
                },
            });
        if (createdCompanyDepartment) {
            console.log(
                `Company-Department created: ${companyDepartment.company_id} - ${companyDepartment.department_id}`,
            );
        }

        // Prefill employee data
        const password = String(process.env.SU_PASS);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Use upsert instead of findOrCreate to always update the record
        const employeeData = {
            employee_id: Number(process.env.SU_EMPLOYEE_ID)!,
            first_name: process.env.SU_FIRST_NAME!,
            middle_name: process.env.SU_MIDDLE_NAME!,
            last_name: process.env.SU_LAST_NAME!,
            phone_number: Number(process.env.SU_PHONE)!,
            email: process.env.SU_EMAIL!,
            password: hashedPassword,
            generated_password: 'In the .env file',
            company_id: process.env.SU_COMPANY!,
            role_id: process.env.SU_ROLE!,
            branch_id: process.env.SU_BRANCH!,
            department_id: process.env.SU_DEPARTMENT!,
            account_creator: 'System',
            is_signatory: true,
            can_assign_clearances: true,
            can_create_templates: true,
            can_create_accounts: true,
            can_access_logs: true,
            can_create_roles: true,
            can_create_companies: true,
            can_create_departments: true,
            can_create_branches: true,
            can_access_all_clearances: true, // <-- Added
            can_create_clearance_requests: true, // <-- Added
            can_clear_clearances: true, // renamed from can_approve_clearances
            can_add_signatory: true, // <-- Added
        };

        // Use upsert to create or update the employee
        const [employee, created] = await Employee.upsert(employeeData);

        if (created) {
            console.log(
                `Admin Employee created: ${employee.first_name} ${employee.last_name}`,
            );
        } else {
            console.log(
                `Admin Employee updated: ${employee.first_name} ${employee.last_name}`,
            );
        }
    } catch (error) {
        console.error('Error pre-filling data:', error);
    }
};

export default prefillData;
