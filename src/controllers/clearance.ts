import { Request, Response } from 'express';
import { apiRespond } from '../utils/apiRespond';
import Clearance from '../database/models/clearance';
import Company from '../database/models/company';
import Branch from '../database/models/branch';
import Department from '../database/models/department';
import Employee from '../database/models/employee';
import ClearanceSignatory from '../database/models/clearanceSignatory';
import { Op } from 'sequelize';

/**
 * Create a new clearance request.
 * @route POST /clearances
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 201 - Created clearance request
 * 
 * @example
 * // Request body:
 * {
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "email": "john.doe@example.com",
 *   "company_id": 1,
 *   "branch_id": 2,
 *   "department_id": 3,
 *   "purpose": "Resignation"
 * }
 * 
 * // Response:
 * {
 *   "status": 201,
 *   "success": true,
 *   "message": "Clearance request created successfully",
 *   "data": { ...clearanceObject }
 * }
 */
export const createClearanceRequest = async (req: Request, res: Response) => {
    try {
        const {
            first_name,
            middle_name,
            last_name,
            email,
            company_id,
            branch_id,
            department_id,
            purpose,
            id_number,
            effectivity_date,
            immediate_head,
            position,
        } = req.body;

        const created = await Clearance.create({
            first_name,
            middle_name: middle_name || null,
            last_name,
            email,
            company_id,
            branch_id,
            department_id,
            purpose,
            id_number: id_number || null,
            effectivity_date: effectivity_date || null,
            immediate_head: immediate_head || null,
            position: position || null,
        } as any);

        // Re-fetch so the response includes all columns (including the new fields)
        const newClearance = await Clearance.findOne({
            where: { id: created.id },
            include: [
                { model: Company },
                { model: Branch },
                { model: Department },
            ],
            // Explicitly select all fields
            attributes: {
                include: [
                    'id_number',
                    'effectivity_date',
                    'immediate_head',
                    'position'
                ]
            }
        });

        return apiRespond(res, {
            status: 201,
            success: true,
            message: 'Clearance request created successfully',
            data: newClearance ? newClearance.get({ plain: true }) : null,
        });
    } catch (error) {
        console.error('Error creating clearance request:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error while creating clearance request',
        });
    }
};

/**
 * Get all clearance requests.
 * @route GET /clearances
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - List of clearance requests
 * 
 * @example
 * // Response:
 * {
 *   "status": 200,
 *   "success": true,
 *   "message": "All clearance requests retrieved successfully",
 *   "data": [
 *     {
 *       "id": 1,
 *       "first_name": "John",
 *       "last_name": "Doe",
 *       "company": { ... },
 *       "branch": { ... },
 *       "department": { ... },
 *       "assigner": { ... }
 *     },
 *     // ...
 *   ]
 * }
 */
export const getAllClearanceRequests = async (req: Request, res: Response) => {
    try {
        const clearances = await Clearance.findAll({
            include: [
                { model: Company },
                { model: Branch },
                { model: Department },
                { model: Employee, as: 'assigner' },
            ],
        });
        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'All clearance requests retrieved successfully',
            data: clearances,
        });
    } catch (error) {
        console.error('Error retrieving clearance requests:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Internal server error while retrieving clearance requests',
        });
    }
};

/**
 * Assign template signatories to a clearance.
 * @route PUT /clearance/:id/assign-template
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - Template signatories assigned
 * 
 * @example
 * // Request body:
 * {
 *   "signatory_ids": [4, 5, 6],
 *   "employee": { "employee_id": 2 }
 * }
 * 
 * // Response:
 * {
 *   "status": 200,
 *   "success": true,
 *   "message": "Template signatories assigned to clearance successfully",
 *   "data": { ...clearanceObject }
 * }
 */
export const assignTemplateData = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { signatory_ids, employee } = req.body;
        const employee_id = employee?.employee_id;

        const clearance = await Clearance.findByPk(id);
        if (!clearance) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'Clearance request not found',
            });
        }
        if (!Array.isArray(signatory_ids) || signatory_ids.length === 0) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'No signatory_ids provided. At least one signatory is required.',
            });
        }

        // Update assigned_by and clearance_status if needed
        clearance.assigned_by = employee_id;
        if (clearance.clearance_status === 'pending') {
            clearance.clearance_status = 'in progress';
        }
        await clearance.save();

        for (const signatoryId of signatory_ids) {
            await ClearanceSignatory.findOrCreate({
                where: {
                    clearance_id: Number(id),
                    signatory_id: signatoryId,
                },
            });
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Template signatories assigned to clearance successfully',
            data: clearance,
        });
    } catch (error: any) {
        console.error('Error assigning template data:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: `Error assigning template data: ${error.message || String(error)}`,
        });
    }
};

/**
 * Get all signatories for a clearance.
 * @route GET /clearance/:clearance_id/signatories
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - List of signatories for the clearance
 * 
 * @example
 * // Response:
 * {
 *   "status": 200,
 *   "success": true,
 *   "message": "Signatories for clearance retrieved successfully",
 *   "data": [
 *     {
 *       "id": 1,
 *       "clearance_id": 1,
 *       "signatory_id": 4,
 *       "is_approved": false,
 *       "status": "Pending",
 *       "Employee": { ... }
 *     },
 *     // ...
 *   ]
 * }
 */
export const getSignatoriesFromClearance = async (req: Request, res: Response) => {
    try {
        const { clearance_id } = req.params;

        // Ensure association exists
        if (!Object.keys(ClearanceSignatory.associations).includes('Employee')) {
            ClearanceSignatory.belongsTo(Employee, { foreignKey: 'signatory_id' });
        }

        const signatories = await ClearanceSignatory.findAll({
            where: { clearance_id },
            include: [{ model: Employee }],
        });

        // Determine overall status for the clearance
        let status = "Pending";
        if (signatories.length > 0) {
            const approvedCount = signatories.filter(s => s.is_approved === true).length;
            if (approvedCount === 0) {
                status = "Pending";
            } else if (approvedCount === signatories.length) {
                status = "Approved";
            } else {
                status = "In Progress";
            }
        }

        // Attach status to each signatory for frontend compatibility
        const signatoriesWithStatus = signatories.map(s => {
            const sObj = s.toJSON();
            return {
                ...sObj,
                status: s.is_approved === true
                    ? (signatories.filter(x => x.is_approved === true).length === signatories.length ? "Approved" : "In Progress")
                    : "Pending"
            };
        });

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Signatories for clearance retrieved successfully',
            data: signatoriesWithStatus,
        });
    } catch (error: any) {
        console.error('Error retrieving signatories:', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: `Error retrieving signatories: ${error.message || String(error)}`,
        });
    }
};

/**
 * Get all clearances for the authenticated employee.
 * @route GET /my-clearances
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - List of clearances for the employee
 * 
 * @example
 * // Request body:
 * {
 *   "employee": {
 *     "employee_id": 2,
 *     "can_access_all_clearances": true
 *   }
 * }
 * 
 * // Response (if can_access_all_clearances is true):
 * {
 *   "status": 200,
 *   "success": true,
 *   "message": "All clearances fetched successfully",
 *   "data": {
 *     "clearances": [ ... ],
 *     "other_clearances": [ ... ]
 *   }
 * }
 * // Response (if can_access_all_clearances is false):
 * {
 *   "status": 200,
 *   "success": true,
 *   "message": "Clearances fetched successfully",
 *   "data": [ ... ]
 * }
 */
export const getMyClearances = async (req: Request, res: Response) => {
    try {
        const employee = req.body.employee;
        if (!employee || !employee.employee_id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'Missing employee_id in request'
            });
        }

        let clearances;
        if (employee.can_access_all_clearances) {
            clearances = await Clearance.findAll({
                // check if assigned_by is not null
                where: { assigned_by: { [Op.ne]: null as unknown as number } },
                include: [
                    { model: Company },
                    { model: Branch },
                    { model: Department },
                    { model: Employee, as: 'assigner' },
                    {
                        association: 'signatories',
                        include: [{ model: Employee }]
                    }
                ]
            });

            const myClearances = [];
            const otherClearances = [];
            for (const clearance of clearances) {
                const clearanceData = clearance.get({ plain: true }) as any;
                let isSignatory = false;
                if (clearanceData.signatories && Array.isArray(clearanceData.signatories)) {
                    for (const signatory of clearanceData.signatories) {
                        if (signatory.signatory_id === employee.employee_id) {
                            isSignatory = true;
                            // Determine status for this clearance
                            const total = clearanceData.signatories.length;
                            const approved = clearanceData.signatories.filter((s: any) => s.is_approved === true).length;
                            let status = "Pending";
                            if (approved === 0) status = "Pending";
                            else if (approved === total) status = "Approved";
                            else status = "In Progress";
                            // If clearance_status is 'cleared', override
                            if (clearanceData.clearance_status === "cleared") status = "Cleared";
                            myClearances.push({
                                ...signatory,
                                Clearance: {
                                    ...clearanceData,
                                    signatories: undefined,
                                    status
                                },
                                is_approved_by_me: signatory.is_approved === true,
                                status
                            });
                        }
                    }
                }
                if (!isSignatory) {
                    // Determine status for this clearance
                    let status = "Pending";
                    if (clearanceData.signatories && clearanceData.signatories.length > 0) {
                        const total = clearanceData.signatories.length;
                        const approved = clearanceData.signatories.filter((s: any) => s.is_approved === true).length;
                        if (approved === 0) status = "Pending";
                        else if (approved === total) status = "Approved";
                        else status = "In Progress";
                    }
                    if (clearanceData.clearance_status === "cleared") status = "Cleared";
                    otherClearances.push({
                        ...clearanceData,
                        status
                    });
                }
            }

            return apiRespond(res, {
                status: 200,
                success: true,
                message: 'All clearances fetched successfully',
                data: {
                    clearances: myClearances,
                    other_clearances: otherClearances
                }
            });
        } else {
            clearances = await ClearanceSignatory.findAll({
                where: { signatory_id: employee.employee_id },
                include: [
                    {
                        model: Clearance,
                        as: 'Clearance',
                        include: [
                            { model: Company },
                            { model: Branch },
                            { model: Department },
                            { model: Employee, as: 'assigner' },
                            {
                                association: 'signatories',
                                include: [{ model: Employee }]
                            }
                        ],
                    },
                ],
            });

            const result = clearances.map(cs => {
                const data = cs.get({ plain: true }) as typeof cs & {
                    Clearance?: any;
                };
                // Determine status for this clearance
                let status = "Pending";
                if (data.Clearance && data.Clearance.signatories && data.Clearance.signatories.length > 0) {
                    const total = data.Clearance.signatories.length;
                    const approved = data.Clearance.signatories.filter((s: any) => s.is_approved === true).length;
                    if (approved === 0) status = "Pending";
                    else if (approved === total) status = "Approved";
                    else status = "In Progress";
                }
                if (data.Clearance && data.Clearance.clearance_status === "cleared") status = "Cleared";
                return {
                    ...data,
                    is_approved_by_me: data.signatory_id === employee.employee_id ? data.is_approved === true : false,
                    status
                };
            });

            return apiRespond(res, {
                status: 200,
                success: true,
                message: 'Clearances fetched successfully',
                data: result
            });
        }
    } catch (error) {
        apiRespond(res, {
            status: 500,
            success: false,
            message: 'Server error',
            data: error instanceof Error ? error.message : error
        });
    }
};

/**
 * Get clearance details by ID, including signatories and their status.
 * @route GET /clearance/:id/details
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - Clearance details with signatories
 * 
 * @example
 * // Response:
 * {
 *   "status": 200,
 *   "success": true,
 *   "message": "Clearance details fetched successfully",
 *   "data": {
 *     "clearance": { ... },
 *     "signatories": [ ... ]
 *   }
 * }
 */
export const getClearanceDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const clearance = await Clearance.findByPk(id, {
            include: [
                { model: Company },
                { model: Branch },
                { model: Department },
                { model: Employee, as: 'assigner' },
            ],
        });

        if (!clearance) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Clearance not found',
            });
        }

        const signatories = await ClearanceSignatory.findAll({
            where: { clearance_id: id },
            include: [{ model: Employee }],
        });

        const clearanceData = {
            ...clearance.toJSON(),
            full_name: [
                clearance.first_name,
                clearance.middle_name,
                clearance.last_name
            ].filter(Boolean).join(' '),
            email: clearance.email,
            company: (clearance as any).Company ? (clearance as any).Company.name : "",
            branch: (clearance as any).Branch ? (clearance as any).Branch.name : "",
            department: (clearance as any).Department ? (clearance as any).Department.name : "",
            purpose: clearance.purpose,
            assigned_by: clearance.assigned_by,
            clearance_status: clearance.clearance_status,
            createdAt: clearance.createdAt,
        };

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Clearance details fetched successfully',
            data: {
                clearance: clearanceData,
                signatories,
            },
        });
    } catch (error: any) {
        return apiRespond(res, {
            status: 500,
            success: false,
            message: `Error fetching clearance details: ${error.message || String(error)}`,
        });
    }
};

/**
 * Get clearance details by tracking_id, including signatories and their status.
 * @route GET /clearance/tracking/:tracking_id/details
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - Clearance details with signatories
 */
export const getClearanceDetailsByTrackingId = async (req: Request, res: Response) => {
    try {
        const { tracking_id } = req.params;

        const clearance = await Clearance.findOne({
            where: { tracking_id },
            include: [
                { model: Company },
                { model: Branch },
                { model: Department },
                { model: Employee, as: 'assigner' },
            ],
        });

        if (!clearance) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Clearance not found',
            });
        }

        const signatories = await ClearanceSignatory.findAll({
            where: { clearance_id: clearance.id },
            include: [{ model: Employee }],
        });

        const clearanceData = {
            ...clearance.toJSON(),
            full_name: [
                clearance.first_name,
                clearance.middle_name,
                clearance.last_name
            ].filter(Boolean).join(' '),
            email: clearance.email,
            company: (clearance as any).Company ? (clearance as any).Company.name : "",
            branch: (clearance as any).Branch ? (clearance as any).Branch.name : "",
            department: (clearance as any).Department ? (clearance as any).Department.name : "",
            purpose: clearance.purpose,
            assigned_by: clearance.assigned_by,
            clearance_status: clearance.clearance_status,
            createdAt: clearance.createdAt,
        };

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Clearance details fetched successfully',
            data: {
                clearance: clearanceData,
                signatories,
            },
        });
    } catch (error: any) {
        return apiRespond(res, {
            status: 500,
            success: false,
            message: `Error fetching clearance details: ${error.message || String(error)}`,
        });
    }
};

/**
 * Approve a clearance for the authenticated signatory.
 * @route PUT /my-clearance/approve
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - Approval result
 * 
 * @example
 * // Request body:
 * {
 *   "employee": { "employee_id": 4 },
 *   "clearance_id": 1
 * }
 * 
 * // Response:
 * {
 *   "status": 200,
 *   "success": true,
 *   "message": "Clearance approved successfully",
 *   "data": { ...signatoryObject }
 * }
 */
export const approveMyClearance = async (req: Request, res: Response) => {
    try {
        const employee = req.body.employee;
        const { clearance_id } = req.body;

        if (!employee || !employee.employee_id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'Missing employee_id in request'
            });
        }
        if (!clearance_id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'Missing clearance_id in request'
            });
        }

        const signatory = await ClearanceSignatory.findOne({
            where: {
                clearance_id,
                signatory_id: employee.employee_id
            }
        });

        if (!signatory) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Signatory not found for this clearance'
            });
        }

        signatory.is_approved = true;
        signatory.date_approved = new Date();
        await signatory.save();

        // --- Check if all signatories have approved ---
        const allSignatories = await ClearanceSignatory.findAll({
            where: { clearance_id }
        });
        const total = allSignatories.length;
        const approved = allSignatories.filter(s => s.is_approved === true).length;
        let newStatus = "Pending";
        if (approved === 0) newStatus = "Pending";
        else if (approved === total) newStatus = "Approved";
        else newStatus = "In Progress";

        const clearance = await Clearance.findByPk(clearance_id);
        if (clearance) {
            // Only update if not already cleared
            if (clearance.clearance_status !== 'cleared') {
                // Map newStatus to allowed clearance_status values
                let allowedStatus: "pending" | "cleared" | "in progress" | "approved";
                if (newStatus === "Pending") allowedStatus = "pending";
                else if (newStatus === "Approved") allowedStatus = "approved";
                else if (newStatus === "In Progress") allowedStatus = "in progress";
                else allowedStatus = "pending";
                clearance.clearance_status = allowedStatus;
                await clearance.save();
            }
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Clearance approved successfully',
            data: signatory
        });
    } catch (error: any) {
        return apiRespond(res, {
            status: 500,
            success: false,
            message: `Error approving clearance: ${error.message || String(error)}`
        });
    }
};

/**
 * Unapprove (revert approval) of a clearance for the authenticated signatory.
 * @route PUT /my-clearance/unapprove
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - Approval reverted successfully
 */
export const unapproveMyClearance = async (req: Request, res: Response) => {
    try {
        const employee = req.body.employee;
        const { clearance_id } = req.body;

        if (!employee || !employee.employee_id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'Missing employee_id in request'
            });
        }
        if (!clearance_id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'Missing clearance_id in request'
            });
        }

        const signatory = await ClearanceSignatory.findOne({
            where: {
                clearance_id,
                signatory_id: employee.employee_id
            }
        });

        if (!signatory) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Signatory not found for this clearance'
            });
        }

        // Revert approval status to 0 (not approved)
        signatory.is_approved = false;
        signatory.date_approved = undefined;
        await signatory.save();

        // --- Check if all signatories have approved ---
        const allSignatories = await ClearanceSignatory.findAll({
            where: { clearance_id }
        });
        const total = allSignatories.length;
        const approved = allSignatories.filter(s => s.is_approved === true).length;
        let newStatus = "Pending";
        if (approved === 0) newStatus = "Pending";
        else if (approved === total) newStatus = "Approved";
        else newStatus = "In Progress";

        const clearance = await Clearance.findByPk(clearance_id);
        if (clearance) {
            // Only update if not already cleared
            if (clearance.clearance_status !== 'cleared') {
                // Map newStatus to allowed clearance_status values
                let allowedStatus: "pending" | "cleared" | "in progress" | "approved";
                if (newStatus === "Pending") allowedStatus = "pending";
                else if (newStatus === "Approved") allowedStatus = "approved";
                else if (newStatus === "In Progress") allowedStatus = "in progress";
                else allowedStatus = "pending";
                clearance.clearance_status = allowedStatus;
                await clearance.save();
            }
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Approval reverted successfully',
            data: signatory
        });
    } catch (error: any) {
        return apiRespond(res, {
            status: 500,
            success: false,
            message: `Error reverting approval: ${error.message || String(error)}`
        });
    }
};

/**
 * Update a clearance request.
 * @route PUT /clearance/:id
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - Updated clearance
 */
export const updateClearance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            middle_name,
            last_name,
            email,
            company_id,
            branch_id,
            department_id,
            purpose,
            id_number,
            effectivity_date,
            immediate_head,
            position,
        } = req.body;

        console.log('[updateClearance] Request received:', {
            clearanceId: id,
            body: req.body
        });

        // Find the clearance
        const clearance = await Clearance.findByPk(id);

        if (!clearance) {
            console.log('[updateClearance] Clearance not found:', id);
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Clearance not found',
            });
        }

        console.log('[updateClearance] Current clearance:', clearance.toJSON());

        // Update the clearance
        await clearance.update({
            first_name,
            middle_name: middle_name || null,
            last_name,
            email,
            company_id: String(company_id),
            branch_id: String(branch_id),
            department_id: String(department_id),
            purpose,
            id_number: id_number || null,
            effectivity_date: effectivity_date || null,
            immediate_head: immediate_head || null,
            position: position || null,
        } as any);

        console.log('[updateClearance] Clearance updated successfully');

        // Re-fetch with associations
        const updatedClearance = await Clearance.findOne({
            where: { id: clearance.id },
            include: [
                { model: Company },
                { model: Branch },
                { model: Department },
            ],
            attributes: {
                include: [
                    'id_number',
                    'effectivity_date',
                    'immediate_head',
                    'position'
                ]
            }
        });

        console.log('[updateClearance] Updated clearance fetched:', updatedClearance?.toJSON());

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Clearance updated successfully',
            data: updatedClearance ? updatedClearance.get({ plain: true }) : null,
        });
    } catch (error: any) {
        console.error('[updateClearance] Error updating clearance:', error);
        console.error('[updateClearance] Error stack:', error.stack);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: error?.message || 'Internal server error while updating clearance',
        });
    }
};

/**
 * Mark a clearance as cleared by an employee.
 * @route PUT /clearance/:id/mark-cleared
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} 200 - Clearance marked as cleared
 * 
 * @example
 * // Request body:
 * {
 *   "employee": { "employee_id": 5 }
 * }
 * // Response:
 * {
 *   "status": 200,
 *   "success": true,
 *   "message": "Clearance marked as cleared",
 *   "data": { ...clearanceObject }
 * }
 */
export const markClearanceAsCleared = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { employee } = req.body;
        const employee_id = employee?.employee_id;

        if (!employee_id) {
            return apiRespond(res, {
                status: 400,
                success: false,
                message: 'Missing employee_id in request'
            });
        }

        const clearance = await Clearance.findByPk(id);
        if (!clearance) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Clearance not found'
            });
        }

        clearance.clearance_status = 'cleared';
        clearance.cleared_by = employee_id;
        await clearance.save();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Clearance marked as cleared',
            data: clearance
        });
    } catch (error: any) {
        return apiRespond(res, {
            status: 500,
            success: false,
            message: `Error marking clearance as cleared: ${error.message || String(error)}`
        });
    }
};
