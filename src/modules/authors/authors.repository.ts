import { Collection, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Author } from "./authors.model";

export class AuthorsRepository {
    private collection(): Collection<Author> {
        return getDb().collection<Author>("authors");
    }

    async create(data: Omit<Author, "_id">): Promise<Author> {
        const result = await this.collection().insertOne(data as Author);
        return { _id: result.insertedId, ...data };
    }

    async findAll(): Promise<Author[]> {
        return this.collection().find().sort({ createdAt: -1 }).toArray();
    }

    async findById(id: ObjectId): Promise<Author | null> {
        return this.collection().findOne({ _id: id });
    }

    async update(id: ObjectId, changes: Partial<Author>): Promise<Author | null> {
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
}
