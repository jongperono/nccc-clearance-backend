import { Request, Response } from 'express';
import { apiRespond } from '../utils/apiRespond';
import Template from '../database/models/template';
import TemplateSignatory from '../database/models/templateSignatory';
import Employee from '../database/models/employee'; // Import Employee model
import ClearanceRequest from '../database/models/clearance';

/**
 * Creates a new template with associated signatories
 *
 * @route POST /template
 * @param req.body.employee - The authenticated employee making the request
 * @param req.body.title - The template title
 * @param req.body.purpose - The purpose of the template
 * @param req.body.footer_message - Optional footer message for the template
 * @param req.body.signatories - Array of employee IDs to be set as signatories
 *
 * @example
 * // Request body
 * {
 *   "employee": { "employee_id": 1001 },
 *   "title": "IT Equipment Clearance",
 *   "purpose": "Clearance for returning IT equipment",
 *   "footer_message": "All items must be returned in working condition",
 *   "signatories": [1001, 1005]
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Created template data
 *
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 201,
 *     "success": true,
 *     "message": "Template created successfully",
 *     "data": { "template_id": 1, ... }
 *   }
 * }
 */
export const createTemplate = async (req: Request, res: Response) => {
    try {
        const employee = req.body.employee;
        // Create the template record
        const newTemplate = await Template.create({
            creator_employee_id: employee.employee_id,
            updater_employee_id: employee.employee_id,
            title: req.body.title,
            purpose: req.body.purpose,
            footer_message: req.body.footer_message,
        });

        const templateId = newTemplate.template_id!;
        const signatoryEntries = [];

        // Process signatories from request body
        const templateSignatories = req.body.signatories || [];

        // Validate that all employee IDs exist in the employees table
        const validEmployees = await Employee.findAll({
            where: { employee_id: templateSignatories },
            attributes: ['employee_id'],
        });
        const validEmployeeIds = validEmployees.map(emp => emp.employee_id);

        for (const employeeId of templateSignatories) {
            if (validEmployeeIds.includes(Number(employeeId))) {
                signatoryEntries.push({
                    template_id: templateId,
                    employee_id: Number(employeeId),
                });
            }
        }

        // Bulk create signatories if any exist
        if (signatoryEntries.length > 0) {
            await TemplateSignatory.bulkCreate(signatoryEntries);
        }

        return apiRespond(res, {
            status: 201,
            success: true,
            message: 'Template created successfully',
            data: newTemplate,
        });
    } catch (error) {
        console.error('Error creating template', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Error creating template',
        });
    }
};

/**
 * Retrieves all templates with creator employee details and signatory IDs
 *
 * @route GET /templates
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of template objects with creator employee details and signatory IDs
 *
 * @example
 * // Response body
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "All templates retrieved successfully",
 *     "data": [ { "template_id": 1, ... } ]
 *   }
 * }
 */
export const getAllTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await Template.findAll({
            include: [
                {
                    model: Employee,
                    as: 'creator_employee',
                    attributes: ['employee_id', 'first_name', 'last_name', 'email', 'role_id'],
                    required: false
                }
            ]
        });

        // For each template, fetch its signatory_ids and attach directly
        const templatesWithSignatories = await Promise.all(
            templates.map(async (t) => {
                const signatories = await TemplateSignatory.findAll({
                    where: { template_id: t.template_id },
                    attributes: ['employee_id']
                });
                const obj = t.toJSON() as any;
                obj.signatory_ids = signatories.map(s => Number(s.employee_id));
                return obj;
            })
        );

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'All templates retrieved successfully',
            data: templatesWithSignatories,
        });
    } catch (error) {
        console.error('Error retrieving templates', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Error retrieving templates',
        });
    }
};

/**
 * Retrieves a specific template by ID with signatories
 *
 * @route GET /template/:id
 * @param req.params.id - The template ID to retrieve
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Template and signatories data
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Template retrieved successfully",
 *     "data": { "template": { ... }, "signatories": [ ... ] }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Template not found"
 *   }
 * }
 */
export const getTemplateById = async (req: Request, res: Response) => {
    try {
        const templateId = req.params.id;
        const template = await Template.findByPk(templateId);

        if (!template) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Template not found',
            });
        }

        // Get signatories for this template
        const signatories = await TemplateSignatory.findAll({
            where: { template_id: templateId },
        });

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Template retrieved successfully',
            data: { template, signatories },
        });
    } catch (error) {
        console.error('Error retrieving template', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Error retrieving template',
        });
    }
};

/**
 * Updates a template and its signatories
 *
 * @route PUT /template/:id
 * @param req.params.id - The template ID to update
 * @param req.body.employee - The authenticated employee making the update
 * @param req.body.title - Updated template title
 * @param req.body.purpose - Updated template purpose
 * @param req.body.footer_message - Updated footer message
 * @param req.body.signatories - Updated array of employee IDs as signatories
 *
 * @example
 * // Request body
 * {
 *   "employee": { "employee_id": 1001 },
 *   "title": "Updated IT Equipment Clearance",
 *   "purpose": "Updated purpose",
 *   "footer_message": "Updated footer message",
 *   "signatories": [1002, 1003]
 * }
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Object} Response.data - Updated template data
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Template updated successfully",
 *     "data": { "template_id": 1, ... }
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Template not found"
 *   }
 * }
 */
export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const templateId = req.params.id;
        const employee = req.body.employee;
        const { title, purpose, footer_message, signatories } = req.body;

        // Find the template to update
        const template = await Template.findByPk(templateId);

        if (!template) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Template not found',
            });
        }

        // Update template details
        await template.update({
            updater_employee_id: employee.employee_id,
            title,
            purpose,
            footer_message,
        });

        if (signatories) {
            // Delete existing signatories
            await TemplateSignatory.destroy({
                where: { template_id: templateId },
            });

            // Add new signatories
            const signatoryEntries = signatories.map((employeeId: number) => ({
                template_id: Number(templateId),
                employee_id: Number(employeeId),
            }));

            if (signatoryEntries.length > 0) {
                await TemplateSignatory.bulkCreate(signatoryEntries);
            }
        }

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Template updated successfully',
            data: template,
        });
    } catch (error) {
        console.error('Error updating template', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Error updating template',
        });
    }
};

/**
 * Deletes a template and its associated signatories
 *
 * @route DELETE /template/:id
 * @param req.params.id - The template ID to delete
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
 *     "message": "Template deleted successfully"
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Template not found"
 *   }
 * }
 */
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const templateId = req.params.id;

        // Find the template to delete
        const template = await Template.findByPk(templateId);

        if (!template) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Template not found',
            });
        }

        // Delete associated signatories first
        await TemplateSignatory.destroy({
            where: { template_id: templateId },
        });

        // Delete the template
        await template.destroy();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Template deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting template', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Error deleting template',
        });
    }
};

/**
 * Gets all signatories for a specific template with their employee details
 *
 * @route GET /template/:id/signatories
 * @param req.params.id - The template ID to get signatories for
 *
 * @returns {Object} Response object
 * @returns {number} Response.status - HTTP status code
 * @returns {boolean} Response.success - Indicates if operation was successful
 * @returns {string} Response.message - Description of the result
 * @returns {Array} Response.data - Array of signatory objects with employee details
 *
 * @example
 * // Response body - Success
 * {
 *   "data": {
 *     "status": 200,
 *     "success": true,
 *     "message": "Template signatories retrieved successfully",
 *     "data": [ { "template_id": 1, "employee_id": 1001, "employee": { ... } } ]
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Template not found"
 *   }
 * }
 */
export const getTemplateSignatories = async (req: Request, res: Response) => {
    try {
        const templateId = req.params.id;

        // Check if the template exists
        const template = await Template.findByPk(templateId);
        if (!template) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Template not found',
            });
        }

        // Get signatories with their employee details
        const signatories = await TemplateSignatory.findAll({
            where: { template_id: templateId },
            include: [
                {
                    model: Employee,
                    as: 'employee'
                }
            ]
        });

        // Format the response to only include template_id, employee_id, and employee
        const formatted = signatories.map((s: any) => ({
            template_id: s.template_id,
            employee_id: s.employee_id,
            employee: s.employee ? {
                employee_id: s.employee.employee_id,
                first_name: s.employee.first_name,
                last_name: s.employee.last_name,
                email: s.employee.email,
                role_id: s.employee.role_id
            } : undefined
        }));

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Template signatories retrieved successfully',
            data: formatted,
        });
    } catch (error) {
        console.error('Error retrieving template signatories', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Error retrieving template signatories',
        });
    }
};

/**
 * Removes a specific signatory from a template
 *
 * @route DELETE /template/:templateId/signatory/:employeeId
 * @param req.params.templateId - The template ID
 * @param req.params.employeeId - The employee ID to remove as signatory
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
 *     "message": "Signatory removed successfully"
 *   }
 * }
 *
 * // Response body - Not Found
 * {
 *   "data": {
 *     "status": 404,
 *     "success": false,
 *     "message": "Template not found" | "Signatory not found"
 *   }
 * }
 */
export const removeTemplateSignatory = async (req: Request, res: Response) => {
    try {
        const { templateId, employeeId } = req.params;

        // Check if the template exists
        const template = await Template.findByPk(templateId);
        if (!template) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Template not found',
            });
        }

        // Check if the signatory exists
        const signatory = await TemplateSignatory.findOne({
            where: {
                template_id: templateId,
                employee_id: employeeId
            }
        });

        if (!signatory) {
            return apiRespond(res, {
                status: 404,
                success: false,
                message: 'Signatory not found in this template',
            });
        }

        // Delete the signatory
        await signatory.destroy();

        return apiRespond(res, {
            status: 200,
            success: true,
            message: 'Signatory removed successfully',
        });
    } catch (error) {
        console.error('Error removing signatory from template', error);
        return apiRespond(res, {
            status: 500,
            success: false,
            message: 'Error removing signatory from template',
        });
    }
};
