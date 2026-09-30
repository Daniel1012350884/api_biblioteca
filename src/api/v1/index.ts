import { Router } from "express";
import authorsRoutes from "../../modules/authors/authors.routes";

const router = Router();

router.use("/authors", authorsRoutes);

export default router;
