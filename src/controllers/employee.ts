import {Request, Response} from 'express';
import {apiRespond} from '../utils/apiRespond';
import Employee from '../database/models/employee';
import bcrypt from 'bcrypt';
import {createToken} from '../utils/tokenAuth';
import {v4 as uuidv4} from 'uuid';

/**
 * Authenticates an employee and generates a JWT token
 *
 * @route POST /login
 * @param req.body.employee_id - Employee ID for login
 * @param req.body.password - Employee password
 *
 * @example
 * // Request body
 * {
 *   "employee_id": 1001,
 *   "password": "password123"
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {string} Response.token - JWT token for authenticated user
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Login successful",
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 *
 * // Response body - Employee not found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Login error employee does not exist"
 *   }
 * }
 *
 * // Response body - Wrong password
 * {
 *   "data": {
 *     "status": 401,
 *     "success": false,
 *     "message": "Wrong password"
 *   }
 * }
 */
export const loginEmployee = async (req: Request, res: Response) => {
    try {
        const id = req.body.employee_id;
        // Use the withPassword scope to include the password field
        const employee = await Employee.scope('withPassword').findOne({where: {employee_id: id}});
        if (!employee) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Login error employee does not exist',
            });
        }

        const isPasswordValid = await bcrypt.compare(
            req.body.password,
            employee.password,
        );
        if (!isPasswordValid) {
            return apiRespond(res, {
                status: 401,
                success: false,
                message: 'Wrong password',
            });
        }

        const employee_id = employee.employee_id;
        const token = await createToken(employee_id);
        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Login successful',
            token: token,
        });
    } catch (error) {
        console.error('Error logging in', error);
    }
};

/**
 * Creates a new employee
 *
 * @route POST /employee
 * @param req.body.employee - The authenticated employee creating the account
 * @param req.body.employee_id - ID for the new employee
 * @param req.body.first_name - First name of the new employee
 * @param req.body.middle_name - Middle name of the new employee (optional)
 * @param req.body.last_name - Last name of the new employee
 * @param req.body.phone_number - Phone number of the new employee
 * @param req.body.email - Email of the new employee
 * @param req.body.password - Password (optional, will be generated if not provided)
 * @param req.body.company_id - Company ID the employee belongs to
 * @param req.body.role_id - Role ID assigned to the employee
 * @param req.body.branch_id - Branch ID the employee belongs to
 * @param req.body.department_id - Department ID the employee belongs to
 * @param req.body.is_signatory - Whether the employee can sign clearances
 * @param req.body.can_assign_clearances - Whether the employee can assign clearances
 * @param req.body.can_create_templates - Whether the employee can create templates
 * @param req.body.can_create_accounts - Whether the employee can create accounts
 * @param req.body.can_access_logs - Whether the employee can access logs
 *
 * @example
 * // Request body
 * {
 *   "employee": { "employee_id": 1000, "full_name": "Admin User" },
 *   "employee_id": 1001,
 *   "first_name": "John",
 *   "middle_name": "Robert",
 *   "last_name": "Doe",
 *   "phone_number": 1234567890,
 *   "email": "john.doe@example.com",
 *   "company_id": "COMP001",
 *   "role_id": "ADMIN",
 *   "branch_id": "BR001",
 *   "department_id": "DEP001",
 *   "is_signatory": true,
 *   "can_assign_clearances": true,
 *   "can_create_templates": true,
 *   "can_create_accounts": false,
 *   "can_access_logs": false
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 *
 * @example
 * // Response body - Success with generated password
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "New Employee registered with generated password abc123"
 *   }
 * }
 *
 * // Response body - Success with provided password
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "New Employee registered"
 *   }
 * }
 *
 * // Response body - Employee already exists
 * {
 *   "data": {
 *     "status": 409,
 *     "success": false,
 *     "message": "Employee already exists!"
 *   }
 * }
 */
export const createEmployee = async (req: Request, res: Response) => {
    try {
        const account_creator = await req.body.employee;
        if (!account_creator) {
            throw new Error('Account creator null, problem with token');
        }

        const employeeExists = await Employee.findOne({
            where: {employee_id: req.body.employee_id},
        });
        if (employeeExists) {
            return apiRespond(res, {
                status: 409,
                success: false,
                message: 'Employee already exists!',
            });
        }

        const {password} = req.body;
        // Remove explicit permission defaults, rely on model defaults
        const employeeData = {
            ...req.body,
            account_creator: account_creator.full_name,
        };

        if (!password) {
            const generatedPassword = uuidv4().split('-')[0];
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);
            await Employee.create({
                ...employeeData,
                password: hashedPassword,
                generated_password: generatedPassword,
            });
            return apiRespond(res, {
                status: 200,
                success: true,
                message: `New Employee registered with generated password ${generatedPassword}`,
            });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await Employee.create({
                ...employeeData,
                password: hashedPassword,
            });
            return apiRespond(res, {
                status: 200,
                success: true,
                message: 'New Employee registered',
            });
        }
    } catch (error) {
        console.error('Error creating employee', error);
    }
};

/**
 * Retrieves a specific employee by ID
 *
 * @route GET /employee/:id
 * @param req.params.id - The employee ID to retrieve
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Employee data if found (excluding password)
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Employee data",
 *     "data": { "employee_id": 1001, "first_name": "John", ... }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Employee 1001 not found"
 *   }
 * }
 */
export const getEmployee = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'ID parameter missing from request',
            });
        }
        const employee = await Employee.findOne({
            where: {
                employee_id: id,
            },
            attributes: {exclude: ['password']},
        });

        if (!employee) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Employee ${id} not found`,
            });
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Employee data',
            data: employee,
        });
    } catch (error) {
        console.error('Error getting employee data', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error while fetching employee data',
        });
    }
};

/**
 * Retrieves all employees
 *
 * @route GET /employees
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of employee objects (excluding passwords)
 *
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "All employees data",
 *     "data": [ { "employee_id": 1001, ... } ]
 *   }
 * }
 */
export const getAllEmployees = async (req: Request, res: Response) => {
    try {
        const employees = await Employee.findAll({
            attributes: {exclude: ['password']},
        });
        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'All employees data',
            data: employees,
        });
    } catch (error) {
        console.error('Error getting all employees data', error);
    }
};

/**
 * Retrieves all employees marked as signatories
 *
 * @route GET /signatories
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of signatory employee objects (excluding passwords)
 *
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "All signatories data",
 *     "data": [ { "employee_id": 1001, ... } ]
 *   }
 * }
 */
export const getSignatories = async (req: Request, res: Response) => {
    try {
        const signatories = await Employee.findAll({
            where: {is_signatory: true},
            attributes: {exclude: ['password']},
        });
        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'All signatories data',
            data: signatories,
        });
    } catch (error) {
        console.error('Error getting signatories data', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error while fetching signatories',
        });
    }
};

/**
 * Updates an employee by ID
 *
 * @param req.params.id - The employee ID to update
 * @param req.body - Employee attributes to update
 * @param req.body.employee_id - Updated employee ID (if changing)
 * @param req.body.first_name - Updated first name
 * @param req.body.middle_name - Updated middle name
 * @param req.body.last_name - Updated last name
 * @param req.body.email - Updated email
 * @param req.body.phone_number - Updated phone number
 * @param req.body.department_id - Updated department ID
 * @param req.body.branch_id - Updated branch ID
 * @param req.body.role_id - Updated role ID
 * @param req.body.company_id - Updated company ID
 * @param req.body.generated_password - New password (will be hashed)
 * @param req.body.is_signatory - Updated signatory status
 * @param req.body.can_assign_clearances - Updated clearance assignment permission
 * @param req.body.can_create_templates - Updated template creation permission
 * @param req.body.can_create_accounts - Updated account creation permission
 * @param req.body.can_access_logs - Updated logs access permission
 *
 * @example
 * // Request body
 * {
 *   "first_name": "Jonathan",
 *   "email": "jonathan.doe@example.com",
 *   "phone_number": 9876543210,
 *   "role_id": "USER",
 *   "is_signatory": false,
 *   "generated_password": "newpassword123"
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Employee with ID 1001 updated successfully"
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Employee with ID 1001 not found"
 *   }
 * }
 */
export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'ID parameter missing from request',
            });
        }

        const employeeExists = await Employee.findOne({
            where: {employee_id: id},
        });

        if (!employeeExists) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Employee with ID ${id} not found`,
            });
        }

        const {
            employee_id,
            first_name,
            middle_name,
            last_name,
            email,
            phone_number,
            department_id,
            branch_id,
            role_id,
            company_id,
            generated_password,
            is_signatory,
            can_assign_clearances,
            can_create_templates,
            can_create_accounts,
            can_access_logs,
            can_access_all_clearances,
            can_create_clearance_requests, // <-- Added
            can_clear_clearances, // renamed from can_approve_clearances
            can_add_signatory, // <-- Added
        } = req.body;

        const updateData = {
            employee_id,
            first_name,
            middle_name,
            last_name,
            email,
            phone_number,
            department_id,
            branch_id,
            role_id,
            company_id,
            generated_password,
            is_signatory,
            can_assign_clearances,
            can_create_templates,
            can_create_accounts,
            can_access_logs,
            can_access_all_clearances,
            can_create_clearance_requests, // <-- Added
            can_clear_clearances, // renamed from can_approve_clearances
            can_add_signatory, // <-- Added
            password: undefined as string | undefined,
        };

        if (generated_password) {
            const hashedPassword = await bcrypt.hash(generated_password, 10);
            updateData.password = hashedPassword;
        }

        await Employee.update(updateData, {
            where: {employee_id: id},
        });

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Employee with ID ${id} updated successfully`,
        });
    } catch (error) {
        console.error('Error updating employee', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error while updating employee',
        });
    }
};

/**
 * Reset an employee's password to a generated one
 *
 * @route PUT /employee/:id/reset-password
 * @param req.params.id - The employee ID whose password will be reset
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {string} Response.data.generated_password - The newly generated password
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Password reset successfully",
 *     "data": {
 *       "generated_password": "abc12345"
 *     }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Employee with ID 1001 not found"
 *   }
 * }
 */
export const resetEmployeePassword = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'ID parameter missing from request',
            });
        }

        const employee = await Employee.findOne({
            where: { employee_id: id },
        });

        if (!employee) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Employee with ID ${id} not found`,
            });
        }

        // Generate a new password
        const generatedPassword = uuidv4().split('-')[0];
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        await Employee.update(
            {
                password: hashedPassword,
                generated_password: generatedPassword,
            },
            {
                where: { employee_id: id },
            }
        );

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Password reset successfully',
            data: {
                generated_password: generatedPassword,
            },
        });
    } catch (error) {
        console.error('Error resetting employee password', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error while resetting password',
        });
    }
};

/**
 * Allows an employee to change their own password
 *
 * @route PUT /employee/:id/change-password
 * @param req.params.id - Employee ID
 * @param req.body.current_password - Current password for verification
 * @param req.body.new_password - New password
 *
 * @example
 * // Request body
 * {
 *   "current_password": "oldPassword123",
 *   "new_password": "newPassword456"
 * }
 *
 * @returns {Object} Response object
 */
export const changePassword = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { current_password, new_password } = req.body;

        if (!id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'ID parameter missing from request',
            });
        }

        if (!current_password || !new_password) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'Current password and new password are required',
            });
        }

        if (new_password.length < 6) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'New password must be at least 6 characters long',
            });
        }

        // Find the employee with password
        const employee = await Employee.scope('withPassword').findOne({
            where: { employee_id: id },
        });

        if (!employee) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Employee with ID ${id} not found`,
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            current_password,
            employee.password,
        );

        if (!isPasswordValid) {
            return apiRespond(res, {
                status: 401,
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password
        await Employee.update(
            {
                password: hashedPassword,
                generated_password: 'N/A', // Reset the generated password field
            },
            {
                where: { employee_id: id },
            }
        );

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Error changing employee password', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error while changing password',
        });
    }
};
