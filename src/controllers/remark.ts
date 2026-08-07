import { Request, Response } from 'express';
import Remark from '../database/models/remark';
import Employee from '../database/models/employee';
import { apiRespond } from '../utils/apiRespond';

/**
 * Creates a new remark for a clearance.
 *
 * @route POST /remark/:employee_id
 * @param req.params.employee_id - The employee ID making the remark
 * @param req.body.clearance_id - The clearance ID the remark is for
 * @param req.body.remark - The remark text
 *
 * @example
 * // Request body
 * {
 *   "clearance_id": 1,
 *   "employee_id": 1001,
 *   "remark": "Please return your ID."
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Created remark data
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 201,
 *     "success": true,
 *     "message": "Remark created successfully",
 *     "data": { "clearance_id": 1, "employee_id": 1001, "remark": "Please return your ID." }
 *   }
 * }
 */
export const createRemark = async (req: Request, res: Response) => {
    console.log('remarks starts')
    try {
        const { employee, clearance_id, remark } = req.body;
        const employee_id: number = employee?.employee_id;

        const newRemark = await Remark.create({
            clearance_id,
            employee_id,
            remark,
        });

        return apiRespond(res, {
            status: 201,
            success: true,
            message: 'Remark created successfully',
            data: newRemark,
        });
    } catch (error) {
        console.error('Error creating remark:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Failed to create remark',
            data: error,
        });
    }
};

/**
 * Retrieves all remarks for a specific clearance.
 *
 * @route GET /remarks-from-clearance/:clearance_id
 * @param req.params.clearance_id - The clearance ID to fetch remarks for
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of remark objects
 *
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Remarks fetched successfully",
 *     "data": [ { "clearance_id": 1, "employee_id": 1001, "remark": "Please return your ID." } ]
 *   }
 * }
 */
export const getRemarksByClearance = async (req: Request, res: Response) => {
    console.log('get all remarks')
    try {
        const { clearance_id } = req.params;
        console.log('-------------------------clearance id')
        const remarks = await Remark.findAll({
            where: { clearance_id },
            include: [
                {
                    model: Employee,
                    as: 'Employee',
                    attributes: ['employee_id', 'first_name', 'middle_name', 'last_name', 'full_name'],
                },
            ],
        });

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Remarks fetched successfully',
            data: remarks,
        });
    } catch (error) {
        console.error('Error fetching remarks:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Failed to fetch remarks',
            data: error,
        });
    }
};
