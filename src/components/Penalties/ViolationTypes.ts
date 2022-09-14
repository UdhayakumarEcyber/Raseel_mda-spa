import { IContextProvider } from "../../uxp";

export interface IViolationTypes {
    id: string;
    title: string;
    operatorId: string;
    description: string;
    amount: number;
    currency: string;
    parkingGroup: string;
    status: string;
}

export async function fetchViolationTypes(uxpContext: IContextProvider): Promise<IViolationTypes[]> {
    try {
        const response = await uxpContext.executeAction('ViolationTypes', 'violationsAll', {}, { json: true });

        let violationTypes = response?.data as any[];
        return violationTypes as IViolationTypes[];

    } catch (err) { console.error(err); throw err; }
}