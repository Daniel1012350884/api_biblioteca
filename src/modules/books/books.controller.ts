import { Request, Response } from "express";
import { BooksService } from "./books.service";

export class BooksController {
    private readonly booksService = new BooksService();

    create = async (req: Request, res: Response): Promise<void> => {
        const book = await this.booksService.create(req.body);
        res.status(201).json(book);
    };

    findAll = async (req: Request, res: Response): Promise<void> => {
        const available = req.query.available as string | undefined;
        const books = await this.booksService.findAll(available);
        res.status(200).json(books);
    };

    findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const book = await this.booksService.findById(req.params.id);
        res.status(200).json(book);
    };

    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const book = await this.booksService.update(req.params.id, req.body);
        res.status(200).json(book);
    };

    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.booksService.delete(req.params.id);
        res.status(204).send();
    };
}
