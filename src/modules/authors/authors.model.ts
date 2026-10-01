import { ObjectId } from "mongodb";

export interface Author {
    _id?: ObjectId;
    name: string;
    nationality: string;
    birthYear?: number;   // opcional según el enunciado
    biography?: string;   // campo extra, opcional
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthorDTO {
    name?: string;
    nationality?: string;
    birthYear?: number;
    biography?: string;
    active?: boolean;
}
