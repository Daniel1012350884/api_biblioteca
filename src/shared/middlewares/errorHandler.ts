import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../../config/env";

/**
 * Middleware 404: se ejecuta cuando ninguna ruta coincidió.
 */
export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({
        status: "error",
        message:
            `Ruta no encontrada: ${req.method} ${req.originalUrl}. ` +
            "Rutas disponibles: /api/v1/authors, /api/v1/books, /api/v1/loans",
    });
};

type KnownError = Error & { type?: string; code?: number; keyValue?: Record<string, unknown> };

/**
 * Middleware centralizado de errores. Debe registrarse al final,
 * después de las rutas.
 */
export const errorHandler = (
    err: KnownError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = err instanceof AppError ? err.statusCode : 500;
    let message =
        err instanceof AppError || env.nodeEnv !== "production"
            ? err.message
            : "Error interno del servidor";

    // El cliente envió un JSON mal formado (coma sobrante, comillas, llaves...).
    if (err.type === "entity.parse.failed") {
        statusCode = 400;
        message = "El cuerpo de la petición no es un JSON válido (revisa comas sobrantes, comillas y llaves)";
    }
    // Índice único de MongoDB (ej. ISBN repetido en una petición simultánea).
    else if (err.code === 11000) {
        statusCode = 400;
        message = `Ya existe un registro con el mismo valor en: ${Object.keys(err.keyValue ?? {}).join(", ") || "campo único"}`;
    }

    if (statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        status: "error",
        message,
        ...(env.nodeEnv !== "production" && statusCode >= 500 ? { stack: err.stack } : {}),
    });
};
