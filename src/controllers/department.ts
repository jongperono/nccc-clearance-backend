import {Request, Response} from 'express';
import {apiRespond} from '../utils/apiRespond';
import Department from '../database/models/department';

/**
 * Creates a new department.
 *
 * @route POST /department
 * @param req.body.department_id - Unique identifier for the department
 * @param req.body.department_name - Name of the department
 * @param req.body.description - Description of the department
 *
 * @example
 * // Request body
 * {
 *   "department_id": "DEP001",
 *   "department_name": "IT",
 *   "description": "Information Technology Department"
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
 *     "status": 201,
 *     "success": true,
 *     "message": "Department created successfully with ID: DEP001"
 *   }
 * }
 *
 * // Response body - Department already exists
 * {
 *   "data": {
 *     "status": 409,
 *     "success": false,
 *     "message": "Department already exists"
 *   }
 * }
 */
export const createDepartment = async (req: Request, res: Response) => {
    try {
        const {department_id, department_name, description} = req.body;

        const departmentExists = await Department.findOne({
            where: {department_id: department_id},
        });
        if (departmentExists) {
            return apiRespond(res, {
                status: 409,
                success: false,
                message: 'Department already exists',
            });
        }

        const newDepartment = await Department.create({
            department_id,
            department_name,
            description,
        });

        return apiRespond(res, {
            status: 201,
            success: true,
            message: `Department created successfully with ID: ${newDepartment.department_id}`,
        });
    } catch (error) {
        console.error('Error creating department:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Retrieves a specific department by ID.
 *
 * @route GET /department/:id
 * @param req.params.id - The department ID to retrieve
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Department data if found
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Department data",
 *     "data": {
 *       "department_id": "DEP001",
 *       "department_name": "IT",
 *       "description": "Information Technology Department"
 *     }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Department with ID DEP001 not found"
 *   }
 * }
 */
export const getDepartment = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        // Fetch department by ID
        const department = await Department.findOne({
            where: {department_id: id},
        });

        if (!department) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Department with ID ${id} not found`,
            });
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Department data',
            data: department,
        });
    } catch (error) {
        console.error('Error getting department data:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Retrieves all departments.
 *
 * @route GET /departments
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of department objects
 *
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "All departments data",
 *     "data": [
 *       {
 *         "department_id": "DEP001",
 *         "department_name": "IT",
 *         "description": "Information Technology Department"
 *       }
 *       // More departments...
 *     ]
 *   }
 * }
 */
export const getAllDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await Department.findAll();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'All departments data',
            data: departments,
        });
    } catch (error) {
        console.error('Error getting departments data:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Updates a department by ID.
 *
 * @route PUT /department/:id
 * @param req.params.id - The department ID to update
 * @param req.body.department_name - Updated department name
 * @param req.body.description - Updated description
 *
 * @example
 * // Request body
 * {
 *   "department_name": "Updated IT",
 *   "description": "Updated description"
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Updated department data
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Department with ID DEP001 updated successfully",
 *     "data": {
 *       "department_id": "DEP001",
 *       "department_name": "Updated IT",
 *       "description": "Updated description"
 *     }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Department with ID DEP001 not found"
 *   }
 * }
 */
export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const {department_name, description} = req.body;

        const department = await Department.findOne({
            where: {department_id: id},
        });
        if (!department) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Department with ID ${id} not found`,
            });
        }

        department.department_name =
            department_name || department.department_name;
        department.description = description || department.description;

        await department.save();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Department with ID ${id} updated successfully`,
            data: department,
        });
    } catch (error) {
        console.error('Error updating department:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Deletes a department by ID.
 *
 * @route DELETE /department/:id
 * @param req.params.id - The department ID to delete
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
 *     "message": "Department with ID DEP001 deleted successfully"
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Department with ID DEP001 not found"
 *   }
 * }
 */
export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        const department = await Department.findOne({
            where: {department_id: id},
        });
        if (!department) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Department with ID ${id} not found`,
            });
        }

        await department.destroy();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Department with ID ${id} deleted successfully`,
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};
