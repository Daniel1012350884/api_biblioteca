import { Collection, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Genres, GenresFilters } from "./genres.model";

export class GenresRepository {
    private collection(): Collection<Genres> {
        return getDb().collection<Genres>("genres");
    }

    async create(data: Omit<Genres, "_id">): Promise<Genres> {
        const result = await this.collection().insertOne(data as Genres);
        return { _id: result.insertedId, ...data };
    }

    async findAll(filters: GenresFilters = {}): Promise<Genres[]> {
        return this.collection().find(filters).sort({ createdAt: -1 }).toArray();
    }

    async findById(id: ObjectId): Promise<Genres | null> {
        return this.collection().findOne({ _id: id });
    }

    async update(id: ObjectId, changes: Partial<Genres>): Promise<Genres | null> {
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