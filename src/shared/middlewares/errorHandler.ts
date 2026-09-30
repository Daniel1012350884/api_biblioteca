import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../../config/env";

/**
 * Middleware 404: se ejecuta cuando ninguna ruta coincidió.
 */
export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({
        status: "error",
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
};

/**
 * Middleware centralizado de errores. Debe registrarse al final,
 * después de las rutas.
 */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message =
        err instanceof AppError || env.nodeEnv !== "production"
            ? err.message
            : "Error interno del servidor";

    if (statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        status: "error",
        message,
        ...(env.nodeEnv !== "production" && statusCode >= 500 ? { stack: err.stack } : {}),
    });
};
