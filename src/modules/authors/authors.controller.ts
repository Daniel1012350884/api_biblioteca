import { Request, Response } from "express";
import { AuthorsService } from "./authors.service";

export class AuthorsController {
    private readonly authorsService = new AuthorsService();

    create = async (req: Request, res: Response): Promise<void> => {
        const author = await this.authorsService.create(req.body);
        res.status(201).json(author);
    };

    findAll = async (_req: Request, res: Response): Promise<void> => {
        const authors = await this.authorsService.findAll();
        res.status(200).json(authors);
    };

    findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const author = await this.authorsService.findById(req.params.id);
        res.status(200).json(author);
    };

    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const author = await this.authorsService.update(req.params.id, req.body);
        res.status(200).json(author);
    };

    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.authorsService.delete(req.params.id);
        res.status(204).send();
    };
}
