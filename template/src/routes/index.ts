import { Router } from 'express';

// Others
import Controller from '../controllers/handlers';

const router = Router();

/**
 * routes
 */

router.get('/', Controller.get);

export default router;
