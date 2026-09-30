import { Router } from "express";
import { LoansController } from "./loans.controller";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";

const router = Router();
const loansController = new LoansController();

router.post("/", asyncHandler(loansController.create));
router.get("/", asyncHandler(loansController.findAll));
// IMPORTANTE: "/active" debe ir antes de "/:id", si no Express lo tomaría como un id.
router.get("/active", asyncHandler(loansController.findActive));
router.get("/:id", asyncHandler(loansController.findById));
router.put("/:id", asyncHandler(loansController.update));
router.delete("/:id", asyncHandler(loansController.delete));

export default router;
