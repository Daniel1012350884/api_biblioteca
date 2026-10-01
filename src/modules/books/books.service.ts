import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { AuthorsRepository } from "../authors/authors.repository";
import { Book, BookDTO } from "./books.model";
import { BooksRepository } from "./books.repository";
import { ensureHasChanges, ensureRequiredFields, parseObjectId } from "../../shared/utils/validation";

export class BooksService {
    private readonly booksRepository = new BooksRepository();
    private readonly authorsRepository = new AuthorsRepository();

    async create(data: BookDTO): Promise<Book> {
        // Primero se avisa de TODO lo que falta (title, isbn, authorId).
        ensureRequiredFields(data, ["title", "isbn", "authorId"]);

        const title = this.requireString(data.title, "title");
        const isbn = this.requireString(data.isbn, "isbn");
        const authorId = this.toObjectId(data.authorId, "authorId");
        const year = this.optionalYear(data?.year);

        // Relación: el autor debe existir.
        await this.ensureAuthorExists(authorId);
        // ISBN único.
        await this.ensureIsbnIsFree(isbn);

        const now = new Date();
        return this.booksRepository.create({
            title,
            isbn,
            authorId,
            ...(year !== undefined && { year }),
            available: true,
            createdAt: now,
            updatedAt: now,
        });
    }

    async findAll(available?: string): Promise<Book[]> {
        // Extra: GET /books?available=true
        if (available === undefined) return this.booksRepository.findAll();
        if (available !== "true" && available !== "false") {
            throw new BadRequestError("El filtro 'available' debe ser 'true' o 'false'");
        }
        return this.booksRepository.findAll({ available: available === "true" });
    }

    async findById(id: string): Promise<Book> {
        const book = await this.booksRepository.findById(this.toObjectId(id));
        if (!book) throw new NotFoundError("Libro no encontrado");
        return book;
    }

    async update(id: string, data: BookDTO): Promise<Book> {
        data = data ?? {};
        const objectId = this.toObjectId(id);
        const current = await this.booksRepository.findById(objectId);
        if (!current) throw new NotFoundError("Libro no encontrado");

        const changes: Partial<Book> = {};

        if (data.title !== undefined) changes.title = this.requireString(data.title, "title");
        if (data.isbn !== undefined) {
            const isbn = this.requireString(data.isbn, "isbn");
            if (isbn !== current.isbn) await this.ensureIsbnIsFree(isbn);
            changes.isbn = isbn;
        }
        if (data.authorId !== undefined) {
            const authorId = this.toObjectId(data.authorId, "authorId");
            await this.ensureAuthorExists(authorId);
            changes.authorId = authorId;
        }
        if (data.year !== undefined) changes.year = this.optionalYear(data.year);

        ensureHasChanges(changes, ["title", "isbn", "authorId", "year"]);

        changes.updatedAt = new Date();

        const updated = await this.booksRepository.update(objectId, changes);
        if (!updated) throw new NotFoundError("Libro no encontrado");
        return updated;
    }

    async delete(id: string): Promise<void> {
        const deleted = await this.booksRepository.delete(this.toObjectId(id));
        if (!deleted) throw new NotFoundError("Libro no encontrado");
    }

    private async ensureAuthorExists(authorId: ObjectId): Promise<void> {
        if (!(await this.authorsRepository.findById(authorId))) {
            throw new NotFoundError("El autor indicado no existe");
        }
    }

    private async ensureIsbnIsFree(isbn: string): Promise<void> {
        if (await this.booksRepository.findByIsbn(isbn)) {
            throw new BadRequestError(`Ya existe un libro con el ISBN '${isbn}'`);
        }
    }

    private requireString(value: unknown, field: string): string {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
        }
        return value.trim();
    }

    private optionalYear(value: unknown): number | undefined {
        if (value === undefined) return undefined;
        if (typeof value !== "number" || !Number.isInteger(value)) {
            throw new BadRequestError("El campo 'year' debe ser un número entero");
        }
        return value;
    }

    private toObjectId(id: unknown, field = "id"): ObjectId {
        return parseObjectId(id, field);
    }
}
