import { Collection, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Book, BookFilters } from "./books.model";

export type BookWithAuthor = Book & {
    author?: {
        _id: ObjectId;
        name?: string;
        [key: string]: unknown;
    } | null;
};

export class BooksRepository {
    private collection(): Collection<Book> {
        return getDb().collection<Book>("books");
    }

    private toObjectId(id: unknown, field = "id"): ObjectId {
        return parseObjectId(id, field);
    }

    async create(data: Omit<Book, "_id">): Promise<Book> {
        const result = await this.collection().insertOne(data as Book);
        return { _id: result.insertedId, ...data };
    }

    async findAll(filters: BookFilters = {}): Promise<Book[]> {
        return this.collection().find(filters).sort({ createdAt: -1 }).toArray();
    }

    async findAllWithAuthor(): Promise<BookWithAuthor[]> {
        return this.collection()
            .aggregate<BookWithAuthor>([
                ...this.authorLookupStages(),
                { $sort: { createdAt: -1 } },
            ])
            .toArray();
    }

    async findByIdWithAuthor(id: ObjectId | string): Promise<BookWithAuthor | null> {
        const objectId = this.toObjectId(id, "bookId");
        const result = await this.collection()
            .aggregate<BookWithAuthor>([
                { $match: { _id: objectId } },
                ...this.authorLookupStages(),
            ])
            .toArray();
        return result[0] ?? null;
    }

    async findById(id: ObjectId | string): Promise<Book | null> {
        return this.collection().findOne({ _id: this.toObjectId(id, "bookId") });
    }

    async findByIsbn(isbn: string): Promise<Book | null> {
        return this.collection().findOne({ isbn });
    }

    // Usado por la regla de negocio de Autores (no borrar autor con libros).
    async existsByAuthorId(authorId: ObjectId | string): Promise<boolean> {
        return (await this.collection().countDocuments({ authorId: this.toObjectId(authorId, "authorId") }, { limit: 1 })) > 0;
    }

    async update(id: ObjectId | string, changes: Partial<Book>): Promise<Book | null> {
        const objectId = this.toObjectId(id, "bookId");
        const result = await this.collection().findOneAndUpdate(
            { _id: objectId },
            { $set: changes },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    async delete(id: ObjectId | string): Promise<boolean> {
        const objectId = this.toObjectId(id, "bookId");
        const result = await this.collection().deleteOne({ _id: objectId });
        return result.deletedCount === 1;
    }

    /**
     * Marca el libro como prestado SOLO si sigue disponible.
     * El filtro `available: true` hace la operación atómica: evita que dos
     * préstamos simultáneos tomen el mismo libro.
     */
    async markAsLoaned(id: ObjectId | string): Promise<boolean> {
        const objectId = this.toObjectId(id, "bookId");
        const result = await this.collection().updateOne(
            { _id: objectId, available: true },
            { $set: { available: false, updatedAt: new Date() } }
        );
        return result.modifiedCount === 1;
    }

    async markAsAvailable(id: ObjectId | string): Promise<void> {
        const objectId = this.toObjectId(id, "bookId");
        await this.collection().updateOne(
            { _id: objectId },
            { $set: { available: true, updatedAt: new Date() } }
        );
    }

    private authorLookupStages() {
        return [
            {
                $lookup: {
                    from: "authors",
                    localField: "authorId",
                    foreignField: "_id",
                    as: "author",
                },
            },
            { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
        ];
    }

}

function parseObjectId(id: unknown, field = "id"): ObjectId {
    if (id instanceof ObjectId) {
        return id;
    }

    if (typeof id === "string") {
        if (ObjectId.isValid(id)) {
            return new ObjectId(id);
        }
    }

    throw new Error(`Invalid ${field}: expected a valid Mongo ObjectId.`);
}
