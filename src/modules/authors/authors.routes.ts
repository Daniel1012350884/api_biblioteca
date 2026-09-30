import { Router } from "express";
import { AuthorsController } from "./authors.controller";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";

const router = Router();
const authorsController = new AuthorsController();

router.post("/", asyncHandler(authorsController.create));
router.get("/", asyncHandler(authorsController.findAll));
router.get("/:id", asyncHandler(authorsController.findById));
router.put("/:id", asyncHandler(authorsController.update));
router.delete("/:id", asyncHandler(authorsController.delete));

export default router;
