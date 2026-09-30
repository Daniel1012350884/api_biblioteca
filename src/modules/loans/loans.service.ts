import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { BooksRepository } from "../books/books.repository";
import { Loan, LoanDTO } from "./loans.model";
import { LoansRepository } from "./loans.repository";

export class LoansService {
    private readonly loansRepository = new LoansRepository();
    private readonly booksRepository = new BooksRepository();

    async create(data: LoanDTO): Promise<Loan> {
        const bookId = this.toObjectId(data?.bookId as string);
        const userName = this.requireString(data?.userName, "userName");
        const loanDate = this.requireDate(data?.loanDate, "loanDate");

        // Relación: el libro debe existir.
        if (!(await this.booksRepository.findById(bookId))) {
            throw new NotFoundError("El libro indicado no existe");
        }

        // Regla de negocio: solo se presta si available === true.
        // markAsLoaned es atómico: valida y cambia a available:false en un solo paso.
        if (!(await this.booksRepository.markAsLoaned(bookId))) {
            throw new BadRequestError("El libro no está disponible para préstamo");
        }

        const now = new Date();
        try {
            return await this.loansRepository.create({
                bookId,
                userName,
                loanDate,
                returned: false,
                createdAt: now,
                updatedAt: now,
            });
        } catch (error) {
            // Si falla el guardado, se devuelve el libro a disponible (compensación).
            await this.booksRepository.markAsAvailable(bookId);
            throw error;
        }
    }

    async findAll(): Promise<Loan[]> {
        return this.loansRepository.findAll();
    }

    async findActive(): Promise<Loan[]> {
        return this.loansRepository.findActive();
    }

    async findById(id: string): Promise<Loan> {
        const loan = await this.loansRepository.findById(this.toObjectId(id));
        if (!loan) throw new NotFoundError("Préstamo no encontrado");
        return loan;
    }

    async update(id: string, data: LoanDTO): Promise<Loan> {
        const objectId = this.toObjectId(id);
        const loan = await this.loansRepository.findById(objectId);
        if (!loan) throw new NotFoundError("Préstamo no encontrado");

        if (data.bookId !== undefined) {
            throw new BadRequestError("No se puede cambiar el libro de un préstamo existente");
        }

        const changes: Partial<Loan> = {};
        let releaseBook = false;

        if (data.userName !== undefined) changes.userName = this.requireString(data.userName, "userName");
        if (data.loanDate !== undefined) changes.loanDate = this.requireDate(data.loanDate, "loanDate");

        if (data.returned !== undefined) {
            if (typeof data.returned !== "boolean") {
                throw new BadRequestError("El campo 'returned' debe ser booleano");
            }
            if (data.returned && !loan.returned) {
                // Regla de negocio: al devolver se asigna returnDate y el libro vuelve a estar disponible.
                changes.returned = true;
                changes.returnDate = new Date();
                releaseBook = true;
            } else if (!data.returned && loan.returned) {
                throw new BadRequestError("Un préstamo ya devuelto no puede reabrirse");
            }
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }

        changes.updatedAt = new Date();

        const updated = await this.loansRepository.update(objectId, changes);
        if (!updated) throw new NotFoundError("Préstamo no encontrado");

        if (releaseBook) await this.booksRepository.markAsAvailable(loan.bookId);

        return updated;
    }

    async delete(id: string): Promise<void> {
        const objectId = this.toObjectId(id);
        const loan = await this.loansRepository.findById(objectId);
        if (!loan) throw new NotFoundError("Préstamo no encontrado");

        await this.loansRepository.delete(objectId);

        // Si se elimina un préstamo activo, el libro no debe quedar bloqueado.
        if (!loan.returned) await this.booksRepository.markAsAvailable(loan.bookId);
    }

    private requireString(value: unknown, field: string): string {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
        }
        return value.trim();
    }

    private requireDate(value: unknown, field: string): Date {
        if (typeof value !== "string" || value.trim() === "") {
            throw new BadRequestError(`El campo '${field}' es obligatorio (formato ISO, ej: 2026-09-30)`);
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw new BadRequestError(`El campo '${field}' no es una fecha válida`);
        }
        return date;
    }

    private toObjectId(id: string): ObjectId {
        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            throw new BadRequestError(`Identificador inválido: ${id}`);
        }
        return new ObjectId(id);
    }
}
