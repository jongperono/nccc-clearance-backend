import dotenv from 'dotenv';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { apiRespond } from './apiRespond';
import Employee from '../database/models/employee';

dotenv.config();

export async function createToken(employee_id: number) {
    const expirationHours = '3H';

    return jwt.sign({ employee_id: employee_id }, process.env.SECRET as string, {
        expiresIn: expirationHours,
    });
}

export async function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    // const authHeader = req.headers['authorization'];
    // const token = authHeader! && authHeader.split(' ')[1]!;
    const token = req.cookies.token;
    console.log(token, '00000000000')
    if (!token) {
        return apiRespond(res, {
            status: 401,
            success: false,
            message: 'Unauthorized: No Token',
        });
    }

    jwt.verify(
        token,
        process.env.SECRET as string,
        async (
            error: jwt.VerifyErrors | null,
            decoded: JwtPayload | string | undefined,
        ) => {
            if (error) {
                return apiRespond(res, {
                    status: 403,
                    success: false,
                    message: 'Unauthorized: Invalid Token',
                });
            }
            if (
                decoded &&
                typeof decoded !== 'string' &&
                'employee_id' in decoded
            ) {
                try {
                    const employee = await Employee.findOne({
                        where: { employee_id: decoded.employee_id },
                    });
                    if (!employee) {
                        return apiRespond(res, {
                            status: 404,
                            success: false,
                            message: 'Unauthorized: Employee Not Found',
                        });
                    }
                    req.body.employee = employee;
                    next();
                } catch (dbError) {
                    return apiRespond(res, {
                        status: 500,
                        success: false,
                        message: 'Internal Server Error',
                    });
                }
            } else {
                return apiRespond(res, {
                    status: 403,
                    success: false,
                    message: 'Unauthorized: No Employee ID in Token',
                });
            }
        },
    );
}

export const verifyPermissions = async (req: Request, res: Response) => {
    const employee = req.body.employee;
    console.log("Employee from request body------:", employee);
    if (!employee) {
        return apiRespond(res, {
            status: 404,
            success: false,
            message: 'Employee not found.',
        });
    }
    return apiRespond(res, {
        status: 200,
        success: true,
        message: 'Token verified',
        data: {
            employee_id: employee.employee_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            full_name: `${employee.first_name} ${employee.middle_name || ''} ${employee.last_name}`.trim(),
            is_signatory: employee.is_signatory,
            can_assign_clearances: employee.can_assign_clearances,
            can_create_roles: employee.can_create_roles,
            can_create_accounts: employee.can_create_accounts,
            can_create_companies: employee.can_create_companies,
            can_create_departments: employee.can_create_departments,
            can_create_branches: employee.can_create_branches,
            can_create_templates: employee.can_create_templates,
            can_access_logs: employee.can_access_logs,
            can_access_all_clearances: employee.can_access_all_clearances,
            can_create_clearance_requests: employee.can_create_clearance_requests,
            can_clear_clearances: employee.can_clear_clearances,
            can_add_signatory: employee.can_add_signatory,
        },
    });
};

/**
 * Middleware to check if the employee has the required permission.
 * Usage: requirePermission('can_create_roles')
 */
export function requirePermission(permission: keyof typeof permissionMap) {
    return (req: Request, res: Response, next: NextFunction) => {
        const employee = req.body.employee;
        if (!employee) {
            return apiRespond(res, {
                status: 401,
                success: false,
                message: 'Unauthorized: No employee found in request.',
            });
        }
        if (employee[permission] !== true) {
            return apiRespond(res, {
                status: 403,
                success: false,
                message: `Forbidden: Missing required permission (${permission})`,
            });
        }
        next();
    };
}

// Optionally, for type safety, you can define a permission map (for IDE autocomplete)
const permissionMap = {
    is_signatory: 'is_signatory',
    can_assign_clearances: 'can_assign_clearances',
    can_create_roles: 'can_create_roles',
    can_create_accounts: 'can_create_accounts',
    can_create_companies: 'can_create_companies',
    can_create_departments: 'can_create_departments',
    can_create_branches: 'can_create_branches',
    can_create_templates: 'can_create_templates',
    can_access_logs: 'can_access_logs',
    can_access_all_clearances: 'can_access_all_clearances',
    can_create_clearance_requests: 'can_create_clearance_requests',
    can_clear_clearances: 'can_clear_clearances',
};
