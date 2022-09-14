import { IContextProvider } from "../../uxp";
import GeoJson, { Point } from 'geojson';

export type ParkingSiteType = 'OnStreetParking' | 'OffStreetParking';

export type IParkingSite = IOnStreetParkingSite | IOffStreetParkingSite
export interface IOnStreetParkingSite {
    'OnStreetParking.id': string,
    'OnStreetParking.name': string,
    'OnStreetParking.location': GeoJSON.Polygon,
    'OnStreetParking.totalSpotNumber': string,
    'OnStreetParking.availableSpotNumber': string,
    refParkingOperator: string,
    type: ParkingSiteType,
    [key: string]: any
}

export interface IOffStreetParkingSite {
    'OffStreetParking.id': string,
    'OffStreetParking.name': string,
    'OffStreetParking.location': GeoJson.Polygon,
    'OffStreetParking.totalSpotNumber': string,
    'OffStreetParking.availableSpotNumber': string,
    'OffStreetParking.type': ParkingSiteType,
    refParkingOperator: string,
    type: ParkingSiteType,
    [key: string]: any
}

export async function fetchOffStreetParkingSites(uxpContext: IContextProvider): Promise<IParkingSite[]> {
    return await fetchParkingSitesByCategory(uxpContext, 'OffStreetParking')
}

export async function fetchOnStreetParkingSites(uxpContext: IContextProvider): Promise<IParkingSite[]> {
    return await fetchParkingSitesByCategory(uxpContext, 'OnStreetParking')
}

export async function fetchParkingSitesByCategory(uxpContext: IContextProvider, category: ParkingSiteType): Promise<IParkingSite[]> {
    try {
        console.log(`Fetching ${category} Sites...`);

        let actionName = null;

        // Choose appropriate action name for sites
        switch (category) {
            case 'OnStreetParking': actionName = 'onStreetAll'; break;
            case 'OffStreetParking': actionName = 'offStreetAll'; break;
            default: throw Error('Unsupported parking site type...')
        }

        const response = await uxpContext.executeAction('ParkingSite', actionName, { }, { json: true });

        const sites = response?.data.map((siteReponse: any) => {
            let site: { [key: string]: any } = {};

            site['type'] = category;
            site = { ...site, ...siteReponse, type: category }
            return site;
        });

        return sites as IParkingSite[];
    } catch (err) { console.error(err); throw err; }
}

export function fetchAllParkingSites(uxpContext: IContextProvider): Promise<IParkingSite[]> {
    return new Promise<IParkingSite[]>((resolve, reject) => {
        Promise.all([fetchOnStreetParkingSites(uxpContext), fetchOffStreetParkingSites(uxpContext)]).then((result) => {
            let [onStreetParkingSites, offStreetParkingSites] = result;

            resolve([...onStreetParkingSites, ...offStreetParkingSites]);
        }).catch(error => {
            reject(error)
        });
    })
}

export async function findParkingSiteById(id: string, type: ParkingSiteType, uxpContext: IContextProvider): Promise<IParkingSite> {
    try {
        console.log(`Finding Parking Site : ${id} ...`);

        let actionName = type === 'OnStreetParking' ? 'onstreetDetails' : 'offstreetDetails';

        const response = await uxpContext.executeAction('ParkingSite', actionName, { id }, { json: true });

        return { [`${type}.id`]: id, type, ...response?.data };
    } catch (err) { console.error(err); throw err; }
}

export async function findOnStreetParkingSiteById(id: string, uxpContext: IContextProvider): Promise<IOnStreetParkingSite> {
    return await findParkingSiteById(id, 'OnStreetParking', uxpContext) as IOnStreetParkingSite;
}

export async function findOffStreetParkingSiteById(id: string, uxpContext: IContextProvider): Promise<IOffStreetParkingSite> {
    return await findParkingSiteById(id, 'OffStreetParking', uxpContext) as IOffStreetParkingSite;
}

export async function createNewParkingSite(data: any, type: ParkingSiteType, uxpContext: IContextProvider): Promise<string> {
    try {
        console.log(`Creating New ${type} Site`);

        let requestData: { [key: string]: any } = {}

        Object.keys(data).forEach((key) => {
            requestData[`${type}.${key}`] = data[key];
        });

        requestData[`${type}.location`] = JSON.stringify(data.location)
        requestData['refParkingOperator'] = data['refParkingOperator'];


        let actionName = type === 'OnStreetParking' ? 'onstreetCreate' : 'offstreetCreate';

        const response = await uxpContext.executeAction('ParkingSite', actionName, requestData, { json: true });

        return response.data[`${type}.id`];
    } catch (err) { console.error(err); throw err; }
}


export async function editParkingSite(id: string, data: any, type: ParkingSiteType, uxpContext: IContextProvider): Promise<void> {
    try {
        console.log(`Editing ${type} Site`);

        let requestData: { [key: string]: any } = {}

        Object.keys(data).forEach((key) => {
            requestData[`${type}.${key}`] = data[key];
        });

        if (requestData[`${type}.location`]) {
            requestData[`${type}.location`] = JSON.stringify(data.location)
        }
        requestData['refParkingOperator'] = data['refParkingOperator'];

        delete data['ParkingSite.refParkingSpot'];
        delete data['ParkingSite.refParkingGroup'];

        let actionName = type === 'OnStreetParking' ? 'onstreetUpdate' : 'offstreetUpdate';
        await uxpContext.executeAction('ParkingSite', actionName, { id, ...requestData }, { json: true });

    } catch (err) { console.error(err); throw err; }
}


export async function editParkingSiteLocation(id: string, location: any, type: ParkingSiteType, uxpContext: IContextProvider): Promise<string> {
    try {
        console.log('Editing parking site\'s location');

        console.log(location);

        let actionName = (type === 'OnStreetParking') ? 'onstreetUpdate' : 'offstreetUpdate';

        await uxpContext.executeAction('ParkingSite', actionName, { [`${type}.location`]: JSON.stringify(location), id }, { json: true });

        return id;
    } catch (err) { console.error(err); throw err; }
}

export async function deleteParkingSite(id: string, type: ParkingSiteType, uxpContext: IContextProvider): Promise<void> {
    try {
        console.log('Deleting parking site');

        let actionName = (type === 'OnStreetParking') ? 'onstreetRemove' : 'offstreetRemove';

        await uxpContext.executeAction('ParkingSite', actionName, { id }, { json: true });

    } catch (err) { console.error(err); throw err; }
}
