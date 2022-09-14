import GeoJson from "geojson";
import { convertBooleanStringToBoolean } from "../../utils";
import { IContextProvider } from "../../uxp";
import { ParkingSiteType } from "./ParkingSite";

export type RequiredPermitType = 'employeePermit' | 'studentPermit' | 'fairPermit' | 'governmentPermit' | 'residentPermit' | 'disabledPermit';

export type ChargeType = ('additionalIntervalPrice' | 'annualPayment' | 'free' | 'seasonTicket' | 'other');

export interface IParkingGroup {
    'ParkingGroup.id': string,
    /** Parking Site Reference */
    'ParkingGroup.refParkingSite': string,
    'ParkingGroup.name': string,
    'ParkingGroup.category': ParkingSiteType,
    'ParkingGroup.location': GeoJson.Polygon,
    'ParkingGroup.allowedVehicleType': string,
    'ParkingGroup.address': string,
    'ParkingGroup.maximumParkingDuration': number,
    'ParkingGroup.chargeType': ChargeType[]
    'ParkingGroup.requiredPermit': RequiredPermitType
    'ParkingGroup.specialPermits': string[],
    'ParkingGroup.totalSpotNumber': number,
    'ParkingGroup.availableSpotNumber': number,
    'ParkingGroup.areBordersMarked': boolean,
    'ParkingGroup.maximumAllowedHeight': number | null,
    'ParkingGroup.maximumAllowedWidth': number | null,
    'ParkingGroup.occupancyDetectionType': string,
    'ParkingGroup.image': null,
    gracePeriod: number,
    securePreBookingDuration: number,
    smartBillingCapable: boolean,
    chargeGranularity: number,
    chargeUnitPrice: number
}

export async function fetchParkingGroups(uxpContext: IContextProvider): Promise<IParkingGroup[]> {
    try {
        console.log('Fetching Parking Groups...');

        const response = await uxpContext.executeAction('ParkingGroup', 'groupAll', {}, { json: true });

        let groups = response?.data as any[];

        groups = groups.map((group) => ({
            ...group,
            'smartBillingCapable': convertBooleanStringToBoolean(group?.smartBillingCapable),
            'ParkingGroup.areBordersMarked': convertBooleanStringToBoolean(group?.['ParkingGroup.areBordersMarked']),
        }));

        return groups as IParkingGroup[];

    } catch (err) { console.error(err); throw err; }
}

export async function findParkingGroupById(id: string, uxpContext: IContextProvider): Promise<IParkingGroup> {
    try {
        console.log(`Finding Parking Group : ${id} ...`);

        const response = await uxpContext.executeAction('ParkingGroup', 'groupsDetails', { id }, { json: true });

        // This is a big question why the key of id is not 'ParkingGroup.id'
        return {
            'ParkingGroup.id': id, ...response.data,
            'smartBillingCapable': convertBooleanStringToBoolean(response.data?.smartBillingCapable),
            'ParkingGroup.areBordersMarked': convertBooleanStringToBoolean(response.data?.['ParkingGroup.areBordersMarked']),
        } as IParkingGroup;
    } catch (err) { console.error(err); throw err; }
}

export async function createNewParkingGroup(data: any, uxpContext: IContextProvider): Promise<string> {
    try {
        console.log('Creating New Group...');

        data[`ParkingGroup.location`] = JSON.stringify(data['ParkingGroup.location']);
        data[`ParkingGroup.type`] = 'ParkingGroup';
        data[`ParkingGroup.chargeType`] = (data['ParkingGroup.chargeType'] as string[]).join(',');

        const response = await uxpContext.executeAction('ParkingGroup', 'groupsCreate', data, { json: true });

        return response.data['Parking.id'];
    } catch (err) { console.error(err); throw err; }
}

export async function editParkingGroup(id: string, data: any, uxpContext: IContextProvider): Promise<void> {
    try {
        console.log('Editing group...');

        data[`ParkingGroup.location`] = JSON.stringify(data['ParkingGroup.location']);
        data[`ParkingGroup.chargeType`] = (data['ParkingGroup.chargeType'] as string[])?.join(',');

        delete data['ParkingGroup.refParkingSpot'];

        await uxpContext.executeAction('ParkingGroup', 'groupsUpdate', { id, ...data }, { json: true });

    } catch (err) { console.error(err); throw err; }
}

export async function editParkingGroupLocation(id: string, location: any, uxpContext: IContextProvider): Promise<string> {
    try {
        console.log('Editing parking group\'s location');

        await uxpContext.executeAction('ParkingGroup', 'groupsUpdate', { [`ParkingGroup.location`]: JSON.stringify(location), id }, { json: true });

        return id;
    } catch (err) { console.error(err); throw err; }
}

export async function deleteParkingGroup(id: string, uxpContext: IContextProvider): Promise<void> {
    try {
        console.log('Deleting parking group');

        await uxpContext.executeAction('ParkingGroup', 'groupsRemove', { id }, { json: true });

    } catch (err) { console.error(err); throw err; }
}

