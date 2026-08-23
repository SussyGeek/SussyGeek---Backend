import express, { NextFunction, Request, Response } from "express";
import instituteRoutes from "./modules/institute/institute.route";
import contributionRoutes from "./modules/contribution/contribution.routes";
import metaRoutes from "./modules/meta/meta.routes";
import userRoutes from "./modules/user/user.route";
import studentRoutes from "./modules/student/student.routes";
import { rateLimitByIP, rateLimits } from "./middlewares/rateLimit.middleware";

const router = express.Router();

router.use('/institute', instituteRoutes);
router.use('/metadata', metaRoutes);
router.use('/user', userRoutes);
router.use('/contribute', contributionRoutes);
router.use('/student', studentRoutes);

// TODO: Will be moved to an appropriate file soon.
router.get('/health', (req: Request, res: Response, next: NextFunction) => {
    try {
        const mapStats = (map: Map<string, number[]>) => {
            let totalTimestamps = 0;
            for (const timestamps of map.values()) {
                totalTimestamps += timestamps.length;
            }
            let estimatedBytes = 0;
            for (const [key, timestamps] of map) {
                estimatedBytes += key.length * 2;        // JS strings are UTF-16
                estimatedBytes += timestamps.length * 8; // float64 per timestamp
                estimatedBytes += 120;                   // per-entry overhead
            }
            return {
                entries: map.size,
                totalTimestamps,
                estimatedSizeMB: +(estimatedBytes / (1024 * 1024)).toFixed(4),
            };
        };

        return res.json({
            success: true,
            uptimeSeconds: Math.floor(process.uptime()),
            details: {
                rateLimits: mapStats(rateLimits),
                rateLimitByIP: mapStats(rateLimitByIP),
            },
        });
    } catch (err) {
        next(err);
    }
})

export default router;