import {Request, Response} from 'express';
import {apiRespond} from '../utils/apiRespond';
import Company from '../database/models/company';
import CompanyDepartment from '../database/models/companyDepartment';
import Department from '../database/models/department';
import {Op} from 'sequelize';

/**
 * Creates a new company and optionally assigns departments to it
 *
 * @route POST /company
 * @param req.body.company_id - Unique identifier for the company
 * @param req.body.company_name - Name of the company
 * @param req.body.department_ids - Optional array of department IDs to assign
 *
 * @example
 * // Request body
 * {
 *   "company_id": "COMP001",
 *   "company_name": "Tech Solutions",
 *   "department_ids": ["DEP001", "DEP002"]
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Created company and assignment details
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 201,
 *     "success": true,
 *     "message": "Company created successfully with ID: COMP001",
 *     "data": {
 *       "company": { "company_id": "COMP001", "company_name": "Tech Solutions" },
 *       "assignments": { "total_assigned": 2, "new_assignments": 2, "already_assigned": 0 }
 *     }
 *   }
 * }
 *
 * // Response body - Company already exists
 * {
 *   "data": {
 *     "status": 409,
 *     "success": false,
 *     "message": "Company already exists"
 *   }
 * }
 *
 * // Response body - Department not found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "One or more departments do not exist"
 *   }
 * }
 */
export const createCompanyWithDepartments = async (req: Request, res: Response) => {
    try {
        const {company_id, company_name, department_ids} = req.body;

        // Check if company already exists
        const companyExists = await Company.findOne({
            where: {company_id},
        });

        if (companyExists) {
            return apiRespond(res, {
                status: 409,
                success: false,
                message: 'Company already exists',
            });
        }

        // Create the company
        const newCompany = await Company.create({
            company_id,
            company_name,
        });

        let assignmentDetails = null;

        // If department_ids are provided, assign them to the company
        if (
            department_ids &&
            Array.isArray(department_ids) &&
            department_ids.length > 0
        ) {
            // Verify all departments exist
            const departments = await Department.findAll({
                where: {
                    department_id: {
                        [Op.in]: department_ids,
                    },
                },
            });

            if (departments.length !== department_ids.length) {
                return apiRespond(res, {
                    status: 404,
                    success: false,
                    message: 'One or more departments do not exist',
                });
            }

            // Create assignments
            const assignments = department_ids.map(department_id => ({
                company_id,
                department_id,
            }));

            await CompanyDepartment.bulkCreate(assignments);

            assignmentDetails = {
                total_assigned: department_ids.length,
                new_assignments: department_ids.length,
                already_assigned: 0,
            };
        }

        return apiRespond(res, {
            status: 201,
            success: true,
            message: `Company created successfully with ID: ${newCompany.company_id}`,
            data: {
                company: newCompany,
                assignments: assignmentDetails,
            },
        });
    } catch (error) {
        console.error('Error creating company with departments:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Retrieves all companies
 *
 * @route GET /companies
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of company objects
 *
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "All companies data",
 *     "data": [
 *       { "company_id": "COMP001", "company_name": "Tech Solutions" },
 *       { "company_id": "COMP002", "company_name": "Finance Corp" }
 *     ]
 *   }
 * }
 */
export const getAllCompanies = async (_req: Request, res: Response) => {
    try {
        const companies = await Company.findAll();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'All companies data',
            data: companies,
        });
    } catch (error) {
        console.error('Error getting companies data:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Updates a company by ID and optionally updates department assignments
 *
 * @route PUT /company/:id
 * @param req.params.id - The company ID to update
 * @param req.body.company_name - Updated company name
 * @param req.body.department_ids - Optional array of department IDs to assign
 *
 * @example
 * // Request body
 * {
 *   "company_name": "Tech Innovations",
 *   "department_ids": ["DEP003", "DEP004"]
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Updated company and assignment details
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Company with ID COMP001 updated successfully",
 *     "data": {
 *       "company": { "company_id": "COMP001", "company_name": "Tech Innovations" },
 *       "assignments": { "total_assigned": 2, "new_assignments": 2, "already_assigned": 0 }
 *     }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Company with ID COMP001 not found"
 *   }
 * }
 *
 * // Response body - Department not found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "One or more departments do not exist"
 *   }
 * }
 */
export const updateCompany = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const {company_name, department_ids} = req.body;

        // Check if the company exists
        const company = await Company.findOne({
            where: {company_id: id},
        });

        if (!company) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Company with ID ${id} not found`,
            });
        }

        // Update company name if provided
        if (company_name) {
            company.company_name = company_name;
            await company.save();
        }

        let assignmentDetails = null;

        // If department_ids are provided, update department assignments
        if (
            department_ids &&
            Array.isArray(department_ids) &&
            department_ids.length > 0
        ) {
            // Verify all departments exist
            const departments = await Department.findAll({
                where: {
                    department_id: {
                        [Op.in]: department_ids,
                    },
                },
            });

            if (departments.length !== department_ids.length) {
                return apiRespond(res, {
                    status: 404,
                    success: false,
                    message: 'One or more departments do not exist',
                });
            }

            // Get existing assignments
            const existingAssignments = await CompanyDepartment.findAll({
                where: {company_id: id},
            });

            const existingDepartmentIds = existingAssignments.map(
                a => a.department_id,
            );

            // Determine new and already assigned departments
            const newAssignments = department_ids.filter(
                depId => !existingDepartmentIds.includes(depId),
            );
            const alreadyAssigned = department_ids.filter(depId =>
                existingDepartmentIds.includes(depId),
            );

            // Create new assignments
            if (newAssignments.length > 0) {
                const assignments = newAssignments.map(department_id => ({
                    company_id: id,
                    department_id,
                }));
                await CompanyDepartment.bulkCreate(assignments);
            }

            assignmentDetails = {
                total_assigned: department_ids.length,
                new_assignments: newAssignments.length,
                already_assigned: alreadyAssigned.length,
            };
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Company with ID ${id} updated successfully`,
            data: {
                company,
                assignments: assignmentDetails,
            },
        });
    } catch (error) {
        console.error('Error updating company:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Deletes (soft-deletes) a company by ID
 *
 * @route DELETE /company/:id
 * @param req.params.id - The company ID to delete
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
 *     "message": "Company with ID COMP001 successfully deactivated"
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Company with ID COMP001 not found"
 *   }
 * }
 */
export const deleteCompany = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const company = await Company.findOne({
            where: {company_id: id},
        });

        if (!company) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Company with ID ${id} not found`,
            });
        }

        await Company.destroy({
            where: {company_id: id},
        });

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Company with ID ${id} successfully deactivated`,
        });
    } catch (error) {
        console.error('Error deactivating company:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Gets all departments assigned to a company
 *
 * @route GET /company/:id/departments
 * @param req.params.id - The company ID to get departments for
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of department objects
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Departments for company with ID COMP001",
 *     "data": [
 *       { "department_id": "DEP001", "department_name": "Information Technology", "description": "IT department" },
 *       { "department_id": "DEP002", "department_name": "Human Resources", "description": "HR department" }
 *     ]
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Company with ID COMP001 not found"
 *   }
 * }
 */
export const getCompanyDepartments = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        // Check if company exists
        const company = await Company.findOne({
            where: {company_id: id},
        });

        if (!company) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Company with ID ${id} not found`,
            });
        }

        // Get all company department associations
        const companyDepartments = await CompanyDepartment.findAll({
            where: {company_id: id},
        });

        // Get all department IDs assigned to this company
        const departmentIds = companyDepartments.map(cd => cd.department_id);

        // Fetch the actual department data
        const departments = await Department.findAll({
            where: {
                department_id: {
                    [Op.in]: departmentIds,
                },
            },
        });

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Departments for company with ID ${id}`,
            data: departments,
        });
    } catch (error) {
        console.error('Error getting company departments:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};
