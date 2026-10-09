import { Request, Response } from "express";
import { GenresService } from "../genres/genres.service";

export class GenresController {
    private readonly genresService = new GenresService();

    create = async (req: Request, res: Response): Promise<void> => {
        const genre = await this.genresService.create(req.body);
        res.status(201).json(genre);
    };

    findAll = async (_req: Request, res: Response): Promise<void> => {
        const genres = await this.genresService.findAll();
        res.status(200).json(genres);
    };

    findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const genre = await this.genresService.findById(req.params.id);
        res.status(200).json(genre);
    };

    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const genre = await this.genresService.update(req.params.id, req.body);
        res.status(200).json(genre);
    };

    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.genresService.delete(req.params.id);
        res.status(204).send();
    };
}
