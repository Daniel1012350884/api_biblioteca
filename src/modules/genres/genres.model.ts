import { ObjectId } from "mongodb";

export interface Genres {
    _id?: ObjectId;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

// `available` no se envía por el cliente: lo controla el módulo de préstamos.
export interface GenresDTO {
    name?: string;
    description?: string;
}

export interface GenresFilters {
    name?: string;
    description?: string;
    _id?: ObjectId;
}
