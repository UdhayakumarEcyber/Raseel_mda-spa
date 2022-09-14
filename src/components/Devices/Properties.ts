import { IContextProvider } from "../../uxp";
import { fetchParkingGroups, IParkingGroup } from "../ParkingInformation/ParkingGroup";
import { fetchAllParkingSites, IParkingSite, ParkingSiteType } from "../ParkingInformation/ParkingSite";
import { fetchParkingSpots, IParkingSpot } from "../ParkingInformation/ParkingSpot";

let ownerType = ['PARKING_BARRIER', 'PARKING_ACCESS', 'PARKING_GROUP', 'PARKING_SPOT'];

let category = ['actuator', 'beacon', 'endgun', 'HVAC', 'implement', 'irrSection', 'irrSystem', 'meter', 'multimedia', 'network', 'sensor'];

let property = ['airPollution', 'atmosphericPressure', 'averageVelocity', 'batteryLife', 'batterySupply', 'cdom', 'conductance', 'conductivity', 'depth', 'eatingActivity', 'electricityConsumption', 'energy', 'fillingLevel', 'freeChlorine', 'gasConsumption', 'gateOpening', 'heading', 'humidity', 'light', 'location', 'milking', 'motion', 'movementActivity', 'noiseLevel', 'occupancy', 'orp', 'pH', 'power', 'precipitation', 'pressure', 'refractiveIndex', 'salinity', 'smoke', 'soilMoisture', 'solarRadiation', 'speed', 'tds', 'temperature', 'trafficFlow', 'tss', 'turbidity', 'waterConsumption', 'waterFlow', 'waterLevel', 'waterPollution', 'weatherConditions', 'weight', 'windDirection', 'windSpeed'];

export interface IParkingOperator {
    "_id": string;
    "companyName": string;
    "registrationNumber": string;
    "mobileNumber": string;
    "email": string;
    "contactName": string;
    "refAdministrator": string;
    "refModerator": string;
    "refParkingSite": Array<any>;
}

// PARKING_ACCESS
interface IParkingAccess {
    "ParkingAccess.address": string;
    "ParkingAccess.category": string;
    "ParkingAccess.height": number
    "ParkingAccess.id": string;
    "ParkingAccess.location": GeoJSON.Polygon;
    "ParkingAccess.name": string;
    "ParkingAccess.refOffStreetParking": string;
    "ParkingAccess.slope": number;
    "ParkingAccess.width": number;
}

export interface IOptions {
    value: string,
    label: string,
}
export interface ICustomOption extends IOptions {
    location?: GeoJSON.Polygon | GeoJSON.Point,
    locationName?: string
}

export async function fetchParkingAccess(uxpContext: IContextProvider): Promise<IParkingAccess[]> {
    try {
        const response = await uxpContext.executeAction('ParkingAccess', 'accessAll', {}, { json: true });

        return response?.data as IParkingAccess[];
    } catch (err) { console.error(err); throw err; }
}

export async function fetchParkingOperator(uxpContext: IContextProvider): Promise<IParkingOperator[]> {
    try {
        const response = await uxpContext.executeAction('ParkingOperator', 'operatorsAll', {}, {json: true});

        return response?.data as IParkingOperator[];
    } catch (err) { console.log(err); throw err; }
}

export async function fetchParkingGroupOptions(uxpContext: IContextProvider): Promise<IOptions[]> {
    const options: IOptions[] = [];

    try {

        const parkingGroups = await fetchParkingGroups(uxpContext);
        const parkingSites = await fetchAllParkingSites(uxpContext);
        
        options.push({ value: "", label: "---select owner---" });

        parkingGroups.forEach(parkingGroup => {
            let label = `${getParkingName(parkingSites, parkingGroup?.["ParkingGroup.category"], parkingGroup["ParkingGroup.refParkingSite"])}-${parkingGroup["ParkingGroup.name"]}`;

            options.push({
                value: parkingGroup["ParkingGroup.id"],
                label
            });
        });

        return options;
    } catch (err) {
        console.log(err);
    }

    return options;
}

export async function fetchOwnerOptions(uxpContext: IContextProvider): Promise<ICustomOption[]> {
    const options: ICustomOption[] = [];
    try {

        const ParkingAccess = await fetchParkingAccess(uxpContext);
        const ParkingGroup = await fetchParkingGroups(uxpContext);
        const ParkingSpot = await fetchParkingSpots(uxpContext)
        const ParkingSite = await fetchAllParkingSites(uxpContext);

        
        function customLabelForParkingSpot(item: IParkingSpot) {
            const group = ParkingGroup.find(s => s['ParkingGroup.id'] === item["ParkingSpot.refParkingGroup"]);
            return  `PARKING_SPOT-${getParkingName(ParkingSite, group?.["ParkingGroup.category"], group?.["ParkingGroup.refParkingSite"])}-${item?.["ParkingSpot.name"]}`
        }

        options.push({ value: "", label: "---select owner---" })

        extractOptions(options, ParkingAccess, "PARKING_ACCESS", "ParkingAccess.id", "ParkingAccess.name", "ParkingAccess.location")
        extractOptions(options, ParkingGroup, "PARKING_GROUP", "ParkingGroup.id", "ParkingGroup.name","ParkingGroup.location", (item) => `PARKING_GROUP-${getParkingName(ParkingSite, item?.["ParkingGroup.category"], item["ParkingGroup.refParkingSite"])}-${item["ParkingGroup.name"]}`)
        extractOptions(options, ParkingSpot, "PARKING_SPOT", "ParkingSpot.id", "ParkingSpot.name", "ParkingSpot.location", customLabelForParkingSpot)

        // options.push({value: "PARKING_BARRIER-", label: "PARKING_BARRIER-"})
        return options;
    } catch (err) {
        console.log(err);
    }
    return options
}

function getParkingName(sites: Array<any>, category: string, refId: string){
    return sites.find(s => s[`${category}.id`] === refId)?.[`${category}.name`] || "";
}

export function extractOptions(options: ICustomOption[], list: Array<any>, prefix: string, valueField: string, labelField: string,locationField: string, customLabel:(item:any)=>string = null) {
    list.forEach(item => {
        options.push({ 
            value: `${prefix}-${item[valueField]}`, 
            label: customLabel ? customLabel(item).toUpperCase() : `${prefix}-${item[labelField]}`.toUpperCase(),
            location: item?.[locationField],
            locationName: item?.[labelField]
        })
    })
}

export function camelCaseToCapitalize(s: string): string {
    return s.replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => {
            return str.toUpperCase();
        })
}

async function fetchOffStreetParking(uxpContext: IContextProvider): Promise<IParkingGroup[]> {
    const ParkingGroup = await fetchParkingGroups(uxpContext);
    const offStreetParking = ParkingGroup.filter(g => g["ParkingGroup.category"] === "OffStreetParking");
    return offStreetParking;
}

async function offStreetParkingOptions(uxpContext: IContextProvider, offStreetParking: IParkingGroup[]): Promise<ICustomOption[]> {
    const options: ICustomOption[] = [];
    try{
        const ParkingSite = await fetchAllParkingSites(uxpContext);

        offStreetParking.forEach( item => {
            options.push({value: item?.["ParkingGroup.id"], label: `${getParkingName(ParkingSite, item?.["ParkingGroup.category"], item["ParkingGroup.refParkingSite"])}-${item["ParkingGroup.name"]}`})
        })
    }catch(err){
        console.log(err);
    }
    return options
}

export { ownerType, category, property, offStreetParkingOptions, fetchOffStreetParking }