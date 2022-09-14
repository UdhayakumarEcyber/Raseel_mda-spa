import { Point } from "geojson";
import { IContextProvider } from "../../uxp";
import { IParkingSite, ParkingSiteType } from "./ParkingSite";

export type ParkingSpotStatusType = 'occupied' | 'free' | 'closed' | 'unknown'
export interface IParkingSpot {
    'ParkingSpot.id': string,
    /** Parking Group Reference */
    'ParkingSpot.refParkingGroup': string,
    'ParkingSpot.name': string,
    'ParkingSpot.description': string,
    'ParkingSpot.location': Point,
    'ParkingSpot.address': string,
    'ParkingSpot.status': ParkingSpotStatusType,
    'ParkingSpot.category': ParkingSiteType
}

export async function fetchParkingSpots(uxpContext: IContextProvider): Promise<IParkingSpot[]> {
    try {
        console.log('Fetching Parking Spots...');

        const response = await uxpContext.executeAction('ParkingSpot', 'spotsAll', { }, { json: true });

        return response?.data as IParkingSpot[];
    } catch (err) { console.error(err); throw err; }
}

export async function findParkingSpotById(id: string, uxpContext: IContextProvider): Promise<IParkingSpot> {
    try {
        console.log(`Finding Parking Spot : ${id} ...`);

        const response = await uxpContext.executeAction('ParkingSpot', 'spotsDetails', { id }, { json: true });

        return { 'ParkingSpot.id': id, ...response?.data } as IParkingSpot;
    } catch (err) { console.error(err); throw err; }
}

export async function createNewParkingSpot(data: any, uxpContext: IContextProvider): Promise<string> {
    try {
        console.log('Creating New Spot...');

        data[`ParkingSpot.location`] = JSON.stringify(data['ParkingSpot.location']);

        const response = await uxpContext.executeAction('ParkingSpot', 'spotsCreate', data, { json: true });

        return response.data['ParkingSpot.id'];
    } catch (err) { console.error(err); throw err; }
}

export async function editParkingSpot(id: string, data: any, uxpContext: IContextProvider): Promise<string> {
    try {
        console.log('Editing parking spot...');

        data[`ParkingSpot.location`] = JSON.stringify(data['ParkingSpot.location']);

        await uxpContext.executeAction('ParkingSpot', 'spotsUpdate', { id, ...data }, { json: true });

        return id;
    } catch (err) { console.error(err); throw err; }
}

export async function editParkingSpotLocation(id: string, location: any, uxpContext: IContextProvider): Promise<string> {
    try {
        console.log('Editing parking spot\'s location');

        await uxpContext.executeAction('ParkingSpot', 'spotsUpdate', { [`ParkingSpot.location`]: JSON.stringify(location), id }, { json: true });

        return id;
    } catch (err) { console.error(err); throw err; }
}


export async function deleteParkingSpot(id: string, uxpContext: IContextProvider): Promise<void> {
    try {
        console.log('Deleting parking spot');

        await uxpContext.executeAction('ParkingSpot', 'spotsRemove', { id }, { json: true });

    } catch (err) { console.error(err); throw err; }
}
