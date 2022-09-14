import { IContextProvider } from "./uxp";

let roles: {[k: string]: string[]} = null;

export async function loadAllRoles(context: IContextProvider) {
    if (!roles) {
        let result = await context.executeAction("SPAUserRoleManager", "GetAllRoles", {}, { json: true });

        if (!!result && result.length > 0 && !!result[0]['roles']) {
            roles = JSON.parse(result[0]['roles']);
        }
    }

    return roles;
}

function _hasRole(appName: string, role: string): boolean {
    role = role.toLowerCase();

    // ripped off from FW - LoginDetails.HasRole
    let roleApp = appName;
    let roleName = "";
    let canSplit = true;
    
    //Special case for lucy roles of the form lucy.model.modelname.foo
    if (appName.toLowerCase() === "lucy" && role.startsWith("model.")) {
        canSplit = false;
    }

    if (role.indexOf(".") !== -1 && canSplit)
    {
        let [r1, r2] = role.split(".", 1);

        roleApp = r1;
        roleName = r2;
    }
    else
    {
        roleName = role;
        roleApp = appName;
    }

    if (role === "any") {
        return true;
    }

    if (!roles[roleApp]) {
        return false;
    }

    return roles[roleApp].indexOf(roleName) !== -1;
}

export function hasRole(role: string): boolean {
    let rolesMap: {[k: string]: string} = {
        "cancreateparkingoperator": "ParkingOperator",
        "canupdateparkingoperator": "ParkingOperator",
        "candeleteparkingoperator": "ParkingOperator",
        "canviewparkingoperator": "ParkingOperator",
        "cancreateparkingspot": "ParkingSpot",
        "canupdateparkingspot": "ParkingSpot",
        "candeleteparkingspot": "ParkingSpot",
        "canviewparkingspot": "ParkingSpot",
        "cancreateparkingsite": "ParkingSite",
        "canupdateparkingsite": "ParkingSite",
        "candeleteparkingsite": "ParkingSite",
        "canviewparkingsite": "ParkingSite",
        "cancreateparkinggroup": "ParkingGroup",
        "canupdateparkinggroup": "ParkingGroup",
        "candeleteparkinggroup": "ParkingGroup",
        "canviewparkinggroup": "ParkingGroup",
        "canassignspecialpermits": "ParkingGroup",
        "cancreatemanufacturer": "Vehicle",
        "canupdatemanufacturer": "Vehicle",
        "candeletemanufacturer": "Vehicle",
        "canviewmanufacturer": "Vehicle",
        "cancreatevehiclebrand": "Vehicle",
        "canupdatevehiclebrand": "Vehicle",
        "candeletevehiclebrand": "Vehicle",
        "canviewvehiclebrand": "Vehicle",
        "cancreatevehiclemodel": "Vehicle",
        "canupdatevehiclemodel": "Vehicle",
        "candeletevehiclemodel": "Vehicle",
        "canviewvehiclemodel": "Vehicle",
        "cancreatevehicle": "Vehicle",
        "canupdatevehicle": "Vehicle",
        "candeletevehicle": "Vehicle",
        "canviewvehicle": "Vehicle",
        "canbookparkingspot": "Parking",
        "cancreateviolationtype": "ViolationTypes",
        "canupdateviolationtype": "ViolationTypes",
        "canviewviolationtype": "ViolationTypes",
        "candeleteviolationtype": "ViolationTypes",
        "cancreatepenalty": "Penalty",
        "canupdatepenalty": "Penalty",
        "canviewpenalty": "Penalty",
        "candeletepenalty": "Penalty",
        "cancreatedriver": "Driver",
        "canupdatedriver": "Driver",
        "candeletedriver": "Driver",
        "canviewdriver": "Driver",
        "canassignspecialpermit": "Driver",
        "canblacklistdriver": "Driver",
        "canunblacklistdriver": "Driver",
        "canviewblacklisteddriver": "Driver",
        "cancreateparkingaccess": "ParkingAccess",
        "canupdateparkingaccess": "ParkingAccess",
        "candeleteparkingaccess": "ParkingAccess",
        "canviewparkingaccess": "ParkingAccess",
        "cancreatedevice": "Devices",
        "canupdatedevice": "Devices",
        "candeletedevice": "Devices",
        "canviewdevice": "Devices",
        "cancreateticket": "SupportTicket",
        "canviewticket": "SupportTicket",
        "canacceptticket": "SupportTicket",
        "canresolveticket": "SupportTicket",
        "canrejectticket": "SupportTicket",
        "canviewparkinghistory": "Parking",
        "canupdatespecialpermits": "SpecialPermits",
        "cancreatespecialpermits": "SpecialPermits",
        "candeletespecialpermits": "SpecialPermits",
        "canviewspecialpermits": "SpecialPermits",
    }

    let model = rolesMap[role];

    if (!!model) {
        return _hasRole("Lucy", "model." + model + "." + role);
    }
    
    return false;
}

export function hasAnyRole(roles: string[]): boolean {
    if (roles.length == 0) {
        return true;
    }

    for (let role of roles) {
        if (hasRole(role)) {
            return true;
        }
    }

    return false;
}