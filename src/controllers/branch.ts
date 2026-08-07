import {Request, Response} from 'express';
import {apiRespond} from '../utils/apiRespond';
import Branch from '../database/models/branch';

/**
 * Creates a new branch.
 *
 * @route POST /branch
 * @param req.body.branch_id - Unique identifier for the branch
 * @param req.body.branch_name - Name of the branch
 * @param req.body.location - Location of the branch
 * @param req.body.contact_number - Contact number for the branch
 *
 * @example
 * // Request body
 * {
 *   "branch_id": "BR001",
 *   "branch_name": "Main Branch",
 *   "location": "Davao City",
 *   "contact_number": "123456789"
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
 *     "message": "Branch created successfully with ID: BR001"
 *   }
 * }
 *
 * // Response body - Branch already exists
 * {
 *   "data": {
 *     "status": 409,
 *     "success": false,
 *     "message": "Branch already exists"
 *   }
 * }
 */
export const createBranch = async (req: Request, res: Response) => {
    try {
        const {branch_id, branch_name, location, contact_number} = req.body;

        // Check if branch already exists
        const branchExists = await Branch.findOne({where: {branch_id}});
        if (branchExists) {
            return apiRespond(res, {
                status: 409,
                success: false,
                message: 'Branch already exists',
            });
        }

        // Create new branch
        const newBranch = await Branch.create({
            branch_id,
            branch_name,
            location,
            contact_number,
        });

        return apiRespond(res, {
            status: 201,
            success: true,
            message: `Branch created successfully with ID: ${newBranch.branch_id}`,
        });
    } catch (error) {
        console.error('Error creating branch:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Retrieves a specific branch by ID.
 *
 * @route GET /branch/:id
 * @param req.params.id - The branch ID to retrieve
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Branch data if found
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Branch data",
 *     "data": {
 *       "branch_id": "BR001",
 *       "branch_name": "Main Branch",
 *       "location": "Davao City",
 *       "contact_number": "123456789"
 *     }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Branch with ID BR001 not found"
 *   }
 * }
 */
export const getBranch = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        // Fetch branch by ID
        const branch = await Branch.findOne({
            where: {branch_id: id},
        });

        if (!branch) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Branch with ID ${id} not found`,
            });
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Branch data',
            data: branch,
        });
    } catch (error) {
        console.error('Error getting branch data:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Retrieves all branches.
 *
 * @route GET /branches
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of branch objects
 *
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "All branches data",
 *     "data": [
 *       {
 *         "branch_id": "BR001",
 *         "branch_name": "Main Branch",
 *         "location": "Davao City",
 *         "contact_number": "123456789"
 *       }
 *       // More branches...
 *     ]
 *   }
 * }
 */
export const getAllBranches = async (req: Request, res: Response) => {
    try {
        const branches = await Branch.findAll();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'All branches data',
            data: branches,
        });
    } catch (error) {
        console.error('Error getting branches data:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Updates a branch by ID.
 *
 * @route PUT /branch/:id
 * @param req.params.id - The branch ID to update
 * @param req.body.branch_name - Updated branch name
 * @param req.body.location - Updated location
 * @param req.body.contact_number - Updated contact number
 *
 * @example
 * // Request body
 * {
 *   "branch_name": "Updated Branch",
 *   "location": "New Location",
 *   "contact_number": "987654321"
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Updated branch data
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Branch with ID BR001 updated successfully",
 *     "data": {
 *       "branch_id": "BR001",
 *       "branch_name": "Updated Branch",
 *       "location": "New Location",
 *       "contact_number": "987654321"
 *     }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Branch with ID BR001 not found"
 *   }
 * }
 */
export const updateBranch = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const {branch_name, location, contact_number} = req.body;

        const branch = await Branch.findOne({where: {branch_id: id}});
        if (!branch) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Branch with ID ${id} not found`,
            });
        }

        branch.branch_name = branch_name || branch.branch_name;
        branch.location = location || branch.location;
        branch.contact_number = contact_number || branch.contact_number;

        await branch.save();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Branch with ID ${id} updated successfully`,
            data: branch,
        });
    } catch (error) {
        console.error('Error updating branch:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};

/**
 * Deletes a branch by ID.
 *
 * @route DELETE /branch/:id
 * @param req.params.id - The branch ID to delete
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
 *     "message": "Branch with ID BR001 deleted successfully"
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Branch with ID BR001 not found"
 *   }
 * }
 */
export const deleteBranch = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        const branch = await Branch.findOne({where: {branch_id: id}});
        if (!branch) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: `Branch with ID ${id} not found`,
            });
        }

        await branch.destroy();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: `Branch with ID ${id} deleted successfully`,
        });
    } catch (error) {
        console.error('Error deleting branch:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error',
        });
    }
};
