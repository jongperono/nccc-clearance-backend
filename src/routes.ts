import express from 'express';
import { Request, Response } from 'express';
import { apiRespond } from './utils/apiRespond';
import {
    createEmployee,
    getAllEmployees,
    getEmployee,
    loginEmployee,
    updateEmployee,
    getSignatories,
    resetEmployeePassword,
    changePassword,
} from './controllers/employee';
import {
    createTemplate,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    getTemplateSignatories,
    removeTemplateSignatory,
} from './controllers/template';
import { authenticateToken, verifyPermissions, requirePermission } from './utils/tokenAuth';
import {
    createRole,
    deleteRole,
    getAllRoles,
    getRole,
    updateRole,
} from './controllers/role';
import {
    createBranch,
    deleteBranch,
    getAllBranches,
    getBranch,
    updateBranch,
} from './controllers/branch';
import {
    createDepartment,
    deleteDepartment,
    getAllDepartments,
    getDepartment,
    updateDepartment,
} from './controllers/department';
import {
    createCompanyWithDepartments,
    getAllCompanies,
    updateCompany,
    deleteCompany,
    getCompanyDepartments,

} from './controllers/company';
import {
    createClearanceRequest,
    getAllClearanceRequests,
    assignTemplateData,
    getSignatoriesFromClearance,
    getMyClearances,
    getClearanceDetails,
    approveMyClearance,
    unapproveMyClearance,
    getClearanceDetailsByTrackingId, // <-- add this import
    markClearanceAsCleared, // <-- add this import
    updateClearance, // <-- add this import
} from './controllers/clearance';
import {
    createRemark,
    getRemarksByClearance,
} from './controllers/remark';

const router = express.Router();
router.get('/test', async (_req: Request, res: Response) => {
    return apiRespond(res, {
        status: 200,
        success: true,
        message: 'NCCC v1 clearance api server is up!',
    });
});

router.get('/test2', async (_req: Request, res: Response) => {
    return apiRespond(res, {
        status: 200,
        success: true,
        message: 'test 2!',
    });
});

router.get('/test/token', async (req: Request, res: Response) => {
    console.log(`/n${req.cookies.token}/n`);
    return apiRespond(res, {
        status: 200,
        success: true,
        message: 'token is ' + req.cookies.token,
    });
});

router.get('/check-permissions', authenticateToken, verifyPermissions);
router.get('/verify', authenticateToken, (req: Request, res: Response) => {
    return apiRespond(res, {
        status: 200,
        success: true,
        message: 'Token is valid.',
        data: null,
    });
});

// route: url/api/v1/
router.post('/login', loginEmployee);
router.post('/employee', authenticateToken, requirePermission('can_create_accounts'), createEmployee);
router.get('/employee/:id', getEmployee);
router.put('/employee/:id', authenticateToken, requirePermission('can_create_accounts'), updateEmployee);
router.put('/employee/:id/reset-password', authenticateToken, requirePermission('can_create_accounts'), resetEmployeePassword);
router.put('/employee/:id/change-password', authenticateToken, changePassword);
router.get('/employees', authenticateToken, requirePermission('can_create_accounts'), getAllEmployees);
router.get('/signatories', authenticateToken, requirePermission('can_create_templates'), getSignatories);

router.post('/role', authenticateToken, requirePermission('can_create_roles'), createRole);
router.get('/roles', authenticateToken, requirePermission('can_create_roles'), getAllRoles);
router.get('/role/:id', authenticateToken, requirePermission('can_create_roles'), getRole);
router.put('/role/:id', authenticateToken, requirePermission('can_create_roles'), updateRole);
router.delete('/role/:id', authenticateToken, requirePermission('can_create_roles'), deleteRole);

router.post('/branch', authenticateToken, requirePermission('can_create_branches'), createBranch);
router.get('/branches', authenticateToken, requirePermission('can_create_branches'), getAllBranches);
router.get('/branch/:id', authenticateToken, requirePermission('can_create_branches'), getBranch);
router.put('/branch/:id', authenticateToken, requirePermission('can_create_branches'), updateBranch);
router.delete('/branch/:id', authenticateToken, requirePermission('can_create_branches'), deleteBranch);

router.post('/department', authenticateToken, requirePermission('can_create_departments'), createDepartment);
router.get('/departments', authenticateToken, requirePermission('can_create_departments'), getAllDepartments);
router.get('/department/:id', authenticateToken, requirePermission('can_create_departments'), getDepartment);
router.put('/department/:id', authenticateToken, requirePermission('can_create_departments'), updateDepartment);
router.delete('/department/:id', authenticateToken, requirePermission('can_create_departments'), deleteDepartment);

// Company routes
router.post('/company', authenticateToken, requirePermission('can_create_companies'), createCompanyWithDepartments);
router.get('/companies', authenticateToken, requirePermission('can_create_companies'), getAllCompanies);
router.put('/company/:id', authenticateToken, requirePermission('can_create_companies'), updateCompany);
router.delete('/company/:id', authenticateToken, requirePermission('can_create_companies'), deleteCompany);
router.get('/company/:id/departments', authenticateToken, requirePermission('can_create_companies'), getCompanyDepartments);

// Clearance routes
router.get('/clearances', authenticateToken, getAllClearanceRequests);
router.post('/clearances', authenticateToken, requirePermission('can_create_clearance_requests'), createClearanceRequest);
router.put('/clearance/:id/assign-template', authenticateToken, assignTemplateData);
router.put('/clearance/:id/mark-cleared', authenticateToken, requirePermission('can_clear_clearances'), markClearanceAsCleared);
router.put('/clearance/:id', authenticateToken, requirePermission('can_create_clearance_requests'), updateClearance);
router.get('/my-clearances', authenticateToken, getMyClearances);
router.get('/clearance/:id/details', authenticateToken, getClearanceDetails);
router.get('/clearance/tracking/:tracking_id/', getClearanceDetailsByTrackingId);
router.put('/my-clearance/approve', authenticateToken, approveMyClearance);
router.put('/my-clearance/unapprove', authenticateToken, unapproveMyClearance);

// ClearanceSignatory routes
router.get('/clearance/:clearance_id/signatories', authenticateToken, getSignatoriesFromClearance);

// Template routes
router.get('/templates', authenticateToken, requirePermission('can_create_templates'), getAllTemplates);
router.post('/template', authenticateToken, requirePermission('can_create_templates'), createTemplate);
router.get('/template/:id/signatories', authenticateToken, requirePermission('can_create_templates'), getTemplateSignatories);
router.delete('/template/:templateId/signatory/:employeeId', authenticateToken, requirePermission('can_create_templates'), removeTemplateSignatory);
router.get('/template/:id', authenticateToken, requirePermission('can_create_templates'), getTemplateById);
router.put('/template/:id', authenticateToken, requirePermission('can_create_templates'), updateTemplate);
router.delete('/template/:id', authenticateToken, requirePermission('can_create_templates'), deleteTemplate);

router.post('/remark', authenticateToken, createRemark);
router.get('/remarks-from-clearance/:clearance_id', getRemarksByClearance);


export default router;
