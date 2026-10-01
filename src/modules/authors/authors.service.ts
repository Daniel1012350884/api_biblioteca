import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { BooksRepository } from "../books/books.repository";
import { Author, AuthorDTO } from "./authors.model";
import { AuthorsRepository } from "./authors.repository";
import { ensureHasChanges, ensureRequiredFields, parseObjectId } from "../../shared/utils/validation";

export class AuthorsService {
    private readonly authorsRepository = new AuthorsRepository();
    private readonly booksRepository = new BooksRepository();

    async create(data: AuthorDTO): Promise<Author> {
        // Primero se avisa de TODO lo que falta (name, nationality).
        ensureRequiredFields(data, ["name", "nationality"]);

        const name = this.requireString(data.name, "name");
        const nationality = this.requireString(data.nationality, "nationality");
        const birthYear = this.optionalBirthYear(data?.birthYear);
        const biography = this.optionalString(data?.biography, "biography");

        if (data?.active !== undefined && typeof data.active !== "boolean") {
            throw new BadRequestError("El campo 'active' debe ser booleano");
        }

        const now = new Date();

        return this.authorsRepository.create({
            name,
            nationality,
            ...(birthYear !== undefined && { birthYear }),
            ...(biography !== undefined && { biography }),
            active: data?.active ?? true,
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

    // Extra: GET /authors/:id/books
    async findBooks(id: string) {
        const author = await this.findById(id); // lanza 404 si el autor no existe
        return this.booksRepository.findAll({ authorId: author._id });
    }

    async update(id: string, data: AuthorDTO): Promise<Author> {
        const objectId = this.toObjectId(id);
        const changes: Partial<Author> = {};

        if (data?.name !== undefined) changes.name = this.requireString(data.name, "name");
        if (data?.nationality !== undefined) {
            changes.nationality = this.requireString(data.nationality, "nationality");
        }
        if (data?.biography !== undefined) {
            changes.biography = this.requireString(data.biography, "biography");
        }
        if (data?.birthYear !== undefined) {
            changes.birthYear = this.optionalBirthYear(data.birthYear);
        }
        if (data?.active !== undefined) {
            if (typeof data.active !== "boolean") {
                throw new BadRequestError("El campo 'active' debe ser booleano");
            }
            changes.active = data.active;
        }

        ensureHasChanges(changes, ["name", "nationality", "birthYear", "biography", "active"]);

        changes.updatedAt = new Date();

        const updated = await this.authorsRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Autor no encontrado");
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        const objectId = this.toObjectId(id);

        // Regla de negocio: no se elimina un autor con libros asociados.
        if (await this.booksRepository.existsByAuthorId(objectId)) {
            throw new BadRequestError("No se puede eliminar un autor que tiene libros asociados");
        }

        const deleted = await this.authorsRepository.delete(objectId);
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

    private optionalString(value: unknown, field: string): string | undefined {
        if (value === undefined) return undefined;
        return this.requireString(value, field);
    }

    // birthYear es opcional, pero si viene debe ser entero positivo y no futuro.
    private optionalBirthYear(value: unknown): number | undefined {
        if (value === undefined) return undefined;
        const currentYear = new Date().getFullYear();
        if (typeof value !== "number" || !Number.isInteger(value) || value <= 0 || value > currentYear) {
            throw new BadRequestError(
                `El campo 'birthYear' debe ser un entero positivo (máximo ${currentYear})`
            );
        }
        return value;
    }

    private toObjectId(id: unknown, field = "id"): ObjectId {
        return parseObjectId(id, field);
    }
}
