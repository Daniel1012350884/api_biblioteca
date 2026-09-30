import { Request, Response } from "express";
import { LoansService } from "./loans.service";

export class LoansController {
    private readonly loansService = new LoansService();

    create = async (req: Request, res: Response): Promise<void> => {
        const loan = await this.loansService.create(req.body);
        res.status(201).json(loan);
    };

    findAll = async (_req: Request, res: Response): Promise<void> => {
        const loans = await this.loansService.findAll();
        res.status(200).json(loans);
    };

    findActive = async (_req: Request, res: Response): Promise<void> => {
        const loans = await this.loansService.findActive();
        res.status(200).json(loans);
    };

    findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const loan = await this.loansService.findById(req.params.id);
        res.status(200).json(loan);
    };

    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const loan = await this.loansService.update(req.params.id, req.body);
        res.status(200).json(loan);
    };

    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.loansService.delete(req.params.id);
        res.status(204).send();
    };
}
