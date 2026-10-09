import { Router } from "express";
import { GenresController } from "./genres.controller";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";

const router = Router();
const genresController = new GenresController();

router.post("/", asyncHandler(genresController.create));
router.get("/", asyncHandler(genresController.findAll));
router.get("/:id", asyncHandler(genresController.findById));
router.put("/:id", asyncHandler(genresController.update));
router.delete("/:id", asyncHandler(genresController.delete));

export default router;