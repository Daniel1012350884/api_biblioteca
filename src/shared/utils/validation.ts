import { ObjectId } from "mongodb";
import { BadRequestError } from "../errors/AppError";

const isBlank = (value: unknown): boolean =>
    value === undefined || value === null || (typeof value === "string" && value.trim() === "");

export function ensureRequiredFields(data: unknown, fields: string[]): void {
    const body = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
    const missing = fields.filter((field) => isBlank(body[field]));

    if (missing.length === 0) return;

    const list = missing.map((field) => `'${field}'`).join(", ");
    throw new BadRequestError(
        missing.length === 1
            ? `Falta el campo obligatorio: ${list}`
            : `Faltan campos obligatorios: ${list}`
    );
}

/** En una actualización, exige que se haya enviado al menos un campo válido. */
export function ensureHasChanges(changes: object, allowedFields: string[]): void {
    if (Object.keys(changes).length === 0) {
        throw new BadRequestError(
            `No se enviaron campos para actualizar. Envía al menos uno de: ${allowedFields
                .map((field) => `'${field}'`)
                .join(", ")}`
        );
    }
}

/** Convierte un texto a ObjectId indicando exactamente qué campo falló. */
export function parseObjectId(value: unknown, field = "id"): ObjectId {
    if (isBlank(value)) {
        throw new BadRequestError(`El campo '${field}' es obligatorio y no puede estar vacío`);
    }
    if (typeof value !== "string" || !ObjectId.isValid(value)) {
        throw new BadRequestError(
            `El campo '${field}' no es un ID válido (debe tener 24 caracteres hexadecimales). Valor recibido: ${JSON.stringify(value)}`
        );
    }
    return new ObjectId(value);
}
