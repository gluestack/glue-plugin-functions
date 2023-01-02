import { Router } from 'express';

// Others
import HealthCheck from '../controllers/health-check';

const router = Router();

/**
 * routes
 */

router.get('/health-check', HealthCheck.handle);

export default router;
