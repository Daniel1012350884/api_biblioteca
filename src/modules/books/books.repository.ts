import { Collection, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Book, BookFilters } from "./books.model";

export class BooksRepository {
    private collection(): Collection<Book> {
        return getDb().collection<Book>("books");
    }

    async create(data: Omit<Book, "_id">): Promise<Book> {
        const result = await this.collection().insertOne(data as Book);
        return { _id: result.insertedId, ...data };
    }

    async findAll(filters: BookFilters = {}): Promise<Book[]> {
        return this.collection().find(filters).sort({ createdAt: -1 }).toArray();
    }

    async findById(id: ObjectId): Promise<Book | null> {
        return this.collection().findOne({ _id: id });
    }

    async findByIsbn(isbn: string): Promise<Book | null> {
        return this.collection().findOne({ isbn });
    }

    // Usado por la regla de negocio de Autores (no borrar autor con libros).
    async existsByAuthorId(authorId: ObjectId): Promise<boolean> {
        return (await this.collection().countDocuments({ authorId }, { limit: 1 })) > 0;
    }

    async update(id: ObjectId, changes: Partial<Book>): Promise<Book | null> {
        const result = await this.collection().findOneAndUpdate(
            { _id: id },
            { $set: changes },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection().deleteOne({ _id: id });
        return result.deletedCount === 1;
    }

    /**
     * Marca el libro como prestado SOLO si sigue disponible.
     * El filtro `available: true` hace la operación atómica: evita que dos
     * préstamos simultáneos tomen el mismo libro.
     */
    async markAsLoaned(id: ObjectId): Promise<boolean> {
        const result = await this.collection().updateOne(
            { _id: id, available: true },
            { $set: { available: false, updatedAt: new Date() } }
        );
        return result.modifiedCount === 1;
    }

    async markAsAvailable(id: ObjectId): Promise<void> {
        await this.collection().updateOne(
            { _id: id },
            { $set: { available: true, updatedAt: new Date() } }
        );
    }
}
