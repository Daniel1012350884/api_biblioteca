import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Envuelve un controlador async para que cualquier promesa rechazada
 * se reenvíe automáticamente a next() y la capture el errorHandler.
 * Es genérico para preservar el tipado de req.params/body del handler.
 */
export const asyncHandler =
    <P = Record<string, string>, ResBody = unknown, ReqBody = unknown>(
        fn: (
            req: Request<P, ResBody, ReqBody>,
            res: Response<ResBody>,
            next: NextFunction
        ) => Promise<unknown>
    ): RequestHandler<P, ResBody, ReqBody> =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
