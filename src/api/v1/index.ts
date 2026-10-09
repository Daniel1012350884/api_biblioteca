import { Router } from "express";
import authorsRoutes from "../../modules/authors/authors.routes";
import booksRoutes from "../../modules/books/books.routes";
import loansRoutes from "../../modules/loans/loans.routes";
import genresRoutes from "../../modules/genres/genres.routes";

const router = Router();

router.use("/authors", authorsRoutes);
router.use("/books", booksRoutes);
router.use("/loans", loansRoutes);
router.use("/genres", genresRoutes);

export default router;