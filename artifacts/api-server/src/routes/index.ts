import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import accountsRouter from "./accounts";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(accountsRouter);

export default router;
