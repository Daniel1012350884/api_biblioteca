import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { Genres, GenresDTO } from "./genres.model";
import { GenresRepository } from "./genres.repository";
import { ensureHasChanges, ensureRequiredFields, parseObjectId } from "../../shared/utils/validation";
import { BooksRepository } from "../books/books.repository"; // <-- NUEVO: Importamos el repositorio de libros

export class GenresService {
    private readonly genresRepository = new GenresRepository();
    private readonly booksRepository = new BooksRepository(); // <-- NUEVO: Instanciamos el repositorio

    async create(data: GenresDTO): Promise<Genres> {
        ensureRequiredFields(data, ["name"]);

        const name = this.requireString(data.name, "name");
        const description = this.optionalString(data.description);
        const now = new Date();

        return this.genresRepository.create({
            name,
            description,
            createdAt: now,
            updatedAt: now,
        });
    }

    async findAll(): Promise<Genres[]> {
        return this.genresRepository.findAll();
    }

    async findById(id: string): Promise<Genres> {
        const genre = await this.genresRepository.findById(this.toObjectId(id));
        if (!genre) throw new NotFoundError("Género no encontrado");
        return genre;
    }

    async update(id: string, data: Partial<GenresDTO>): Promise<Genres> {
        data = data ?? {};
        const objectId = this.toObjectId(id);
        const current = await this.genresRepository.findById(objectId);
        if (!current) throw new NotFoundError("Género no encontrado");

        const changes: Partial<Genres> = {};

        if (data.name !== undefined) changes.name = this.requireString(data.name, "name");
        if (data.description !== undefined) changes.description = this.optionalString(data.description);

        ensureHasChanges(changes, ["name", "description"]);
        changes.updatedAt = new Date();

        const updated = await this.genresRepository.update(objectId, changes);
        if (!updated) throw new NotFoundError("Género no encontrado");
        return updated;
    }

    async delete(id: string): Promise<void> {
        const objectId = this.toObjectId(id);
        
        // <-- NUEVO: Validar que el género no esté en uso por ningún libro
        const hasBooks = await this.booksRepository.existsByGenreId(objectId);
        if (hasBooks) {
            throw new BadRequestError("No se puede eliminar el género porque hay libros asociados a él.");
        }

        const deleted = await this.genresRepository.delete(objectId);
        if (!deleted) throw new NotFoundError("Género no encontrado");
    }

    private requireString(value: unknown, field: string): string {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
        }
        return value.trim();
    }

    private optionalString(value: unknown): string | undefined {
        if (value === undefined) return undefined;
        if (typeof value !== "string") {
            throw new BadRequestError("El campo 'description' debe ser un texto");
        }
        const trimmed = value.trim();
        return trimmed === "" ? undefined : trimmed;
    }

    private toObjectId(id: unknown, field = "id"): ObjectId {
        return parseObjectId(id, field);
    }
}