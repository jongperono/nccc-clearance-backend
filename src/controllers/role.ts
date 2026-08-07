import {Request, Response} from 'express';
import {apiRespond} from '../utils/apiRespond';
import Role from '../database/models/role';

/**
 * Creates a new role
 * 
 * @param req.body.role_id - Unique identifier for the role
 * @param req.body.role_name - Name of the role
 * @param req.body.description - Description of the role
 * 
 * @example
 * // Request body
 * {
 *   "role_id": "ADMIN",
 *   "role_name": "Administrator",
 *   "description": "System administrator with full access"
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
 *     "message": "New Role created with ID: ADMIN"
 *   }
 * }
 * 
 * // Response body - Role already exists
 * {
 *   "data": {
 *     "status": 409,
 *     "success": false,
 *     "message": "Role already exists"
 *   }
 * }
 */
export const createRole = async (req: Request, res: Response) => {
    try {
        const {role_id, role_name, description} = req.body;

        const roleExists = await Role.findOne({
            where: {role_id: role_id},
        });
        if (roleExists) {
            return apiRespond(res, {
                status: 409,
                success: false,
                message: 'Role already exists',
            });
        }

        const newRole = await Role.create({
            role_id,
            role_name,
            description,
        });

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `New Role created with ID: ${newRole.role_id}`,
        });
    } catch (error) {
        console.error('Error creating role:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Retrieves a specific role by ID
 * 
 * @param req.params.id - The role ID to retrieve
 * 
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Role data if found
 * 
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Role data",
 *     "data": {
 *       "role_id": "ADMIN",
 *       "role_name": "Administrator",
 *       "description": "System administrator with full access"
 *     }
 *   }
 * }
 * 
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Role with ID ADMIN not found"
 *   }
 * }
 */
export const getRole = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        const role = await Role.findOne({
            where: {role_id: id},
        });

        if (!role) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Role with ID ${id} not found`,
            });
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Role data',
            data: role,
        });
    } catch (error) {
        console.error('Error getting role data:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Retrieves all roles
 * 
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of role objects
 * 
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "All roles data",
 *     "data": [
 *       {
 *         "role_id": "ADMIN",
 *         "role_name": "Administrator",
 *         "description": "System administrator with full access"
 *       },
 *       {
 *         "role_id": "USER",
 *         "role_name": "Regular User",
 *         "description": "Standard user with limited access"
 *       }
 *       // More roles...
 *     ]
 *   }
 * }
 */
export const getAllRoles = async (req: Request, res: Response) => {
    try {
        const roles = await Role.findAll();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'All roles data',
            data: roles,
        });
    } catch (error) {
        console.error('Error getting roles data:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Updates a role by ID
 * 
 * @param req.params.id - The role ID to update
 * @param req.body.role_name - Updated role name
 * @param req.body.description - Updated role description
 * 
 * @example
 * // Request body
 * {
 *   "role_name": "Super Administrator",
 *   "description": "Updated system administrator with full access"
 * }
 * 
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Updated role data
 * 
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Role with ID ADMIN updated successfully",
 *     "data": {
 *       "role_id": "ADMIN",
 *       "role_name": "Super Administrator",
 *       "description": "Updated system administrator with full access"
 *     }
 *   }
 * }
 * 
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Role with ID ADMIN not found"
 *   }
 * }
 */
export const updateRole = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const {role_name, description} = req.body;

        const role = await Role.findOne({where: {role_id: id}});
        if (!role) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Role with ID ${id} not found`,
            });
        }

        role.role_name = role_name || role.role_name;
        role.description = description || role.description;

        await role.save();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Role with ID ${id} updated successfully`,
            data: role,
        });
    } catch (error) {
        console.error('Error updating role:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Deletes a role by ID
 * 
 * @param req.params.id - The role ID to delete
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
 *     "message": "Role with ID ADMIN deleted successfully"
 *   }
 * }
 * 
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Role with ID ADMIN not found"
 *   }
 * }
 */
export const deleteRole = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        const role = await Role.findOne({where: {role_id: id}});
        if (!role) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Role with ID ${id} not found`,
            });
        }

        await role.destroy();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Role with ID ${id} deleted successfully`,
        });
    } catch (error) {
        console.error('Error deleting role:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};
