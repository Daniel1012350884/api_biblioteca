import { ObjectId } from "mongodb";

export interface Book {
    _id?: ObjectId;
    title: string;
    isbn: string;
    authorId: ObjectId;
    year?: number;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// `available` no se envía por el cliente: lo controla el módulo de préstamos.
export interface BookDTO {
    title?: string;
    isbn?: string;
    authorId?: string;
    year?: number;
}

export interface BookFilters {
    available?: boolean;
    authorId?: ObjectId;
}
