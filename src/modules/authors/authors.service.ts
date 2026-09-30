import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { Author, AuthorDTO } from "./authors.model";
import { AuthorsRepository } from "./authors.repository";

export class AuthorsService {
    private readonly authorsRepository = new AuthorsRepository();

    async create(data: AuthorDTO): Promise<Author> {
        const name = this.requireString(data?.name, "name");
        const nationality = this.requireString(data?.nationality, "nationality");
        const biography = this.requireString(data?.biography, "biography");
        const birthYear = this.requireNumber(data?.birthYear, "birthYear");

        const now = new Date();

        return this.authorsRepository.create({
            name,
            nationality,
            birthYear,
            biography,
            active: typeof data.active === "boolean" ? data.active : true,
            createdAt: now,
            updatedAt: now,
        });
    }

    async findAll(): Promise<Author[]> {
        return this.authorsRepository.findAll();
    }

    async findById(id: string): Promise<Author> {
        const author = await this.authorsRepository.findById(this.toObjectId(id));
        if (!author) {
            throw new NotFoundError("Autor no encontrado");
        }
        return author;
    }

    async update(id: string, data: AuthorDTO): Promise<Author> {
        const objectId = this.toObjectId(id);
        const changes: Partial<Author> = {};

        if (data.name !== undefined) changes.name = this.requireString(data.name, "name");
        if (data.nationality !== undefined) {
            changes.nationality = this.requireString(data.nationality, "nationality");
        }
        if (data.biography !== undefined) {
            changes.biography = this.requireString(data.biography, "biography");
        }
        if (data.birthYear !== undefined) {
            changes.birthYear = this.requireNumber(data.birthYear, "birthYear");
        }
        if (data.active !== undefined) {
            if (typeof data.active !== "boolean") {
                throw new BadRequestError("El campo 'active' debe ser booleano");
            }
            changes.active = data.active;
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }

        changes.updatedAt = new Date();

        const updated = await this.authorsRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Autor no encontrado");
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        const deleted = await this.authorsRepository.delete(this.toObjectId(id));
        if (!deleted) {
            throw new NotFoundError("Autor no encontrado");
        }
    }

    private requireString(value: unknown, field: string): string {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
        }
        return value.trim();
    }

    private requireNumber(value: unknown, field: string): number {
        if (typeof value !== "number" || !Number.isInteger(value)) {
            throw new BadRequestError(`El campo '${field}' debe ser un número entero`);
        }
        if (value < 0 || value > new Date().getFullYear()) {
            throw new BadRequestError(`El campo '${field}' debe estar entre 0 y ${new Date().getFullYear()}`);
        }
        return value;
    }

    private toObjectId(id: string): ObjectId {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestError(`Identificador inválido: ${id}`);
        }
        return new ObjectId(id);
    }
}
