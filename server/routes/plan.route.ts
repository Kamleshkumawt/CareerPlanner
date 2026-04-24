// plan.routes.ts
import { Router } from 'express';
import protect from '../middleware/auth.js';
import { deletePlanController, generatePlanController, getPlanDetailController, getPlanListController, savePlanController } from '../controllers/plan.controller.js';

const router = Router();

router.use(protect);  // All plan routes require auth
router.post('/generate', generatePlanController);
router.post('/save', savePlanController);
router.get('/', getPlanListController);
router.get('/:id', getPlanDetailController);
router.delete('/:id', deletePlanController);
export default router;
