import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import accountsRouter from "./accounts";
import productsRouter from "./products";
import ordersRouter from "./orders";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(accountsRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(settingsRouter);

export default router;
