import { ObjectId } from "mongodb";

export interface Book {
    _id?: ObjectId;
    title: string;
    isbn: string;
    authorId: ObjectId;
    genreIds: ObjectId[]; // <-- AGREGADO para relacionar con géneros
    year?: number;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
    genres?: any[]; // <-- AGREGADO para guardar la info completa al consultar
}

// `available` no se envía por el cliente: lo controla el módulo de préstamos.
export interface BookDTO {
    title?: string;
    isbn?: string;
    authorId?: string;
    genreIds?: string[]; // <-- AGREGADO para recibirlo desde el frontend/Postman
    year?: number;
}

export interface BookFilters {
    available?: boolean;
    authorId?: ObjectId;
}