import React from "react";
import { IErrorCodes, IErrorProps } from "../crud-component";
import { IContextProvider } from "./uxp";
import * as RoleManager from "./role-manager";


export function debounce(func: Function, wait: number, immediate?: boolean) {
    var timeout: any = React.useRef(null);

    return function executedFunction() {
        var context = this;
        var args = arguments;

        var later = function () {
            timeout.current = null;
            if (!immediate) func.apply(context, args);
        };

        var callNow = immediate && !timeout;

        clearTimeout(timeout.current);

        timeout.current = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
};

export function capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function handleSuccessResponse(res: any, successCode: number): { valid: boolean, data: any } {
    let { code, data } = res

    if (res.hasOwnProperty("content/type")) {
        try {
            let _data = JSON.parse(res.data)
            code = _data.code
            data = _data.data
        }
        catch (e) {
            console.log("Unable to parse the response data", res)
        }
    }

    if (!code) {
        console.log("Invalid response", res)
        return { valid: false, data: null }
    }
    if (code != successCode) {
        console.log("Invalid response code", res)
        return { valid: false, data: null }
    }
    return { valid: true, data }
}

export function handleErrorResponse(error: any, errorCodes: IErrorCodes): { valid: boolean, msg?: string } {

    // try to parse the error
    let err: any = error
    let code: number = null
    let message: string = null
    try {
        if (typeof error == 'string') {
            err = JSON.parse(error)
        }
        code = err.code
        message = err.message
    }
    catch (e) {
        console.log("unable to parse error message", e);
    }

    if (!(!!code || code == 0)) return { valid: false, msg: 'Invalid response' }
    let _error = errorCodes[code].find((eCode: IErrorProps) => eCode.error == message)

    if (!_error) return { valid: true, msg: 'Something went wrong' }
    return { valid: true, msg: _error.message }

}

export async function hasRole(context: IContextProvider, role: string) {
    return RoleManager.hasRole(role);
}

export async function hasAnyRole(context: IContextProvider, roles: string[]) {
    return RoleManager.hasAnyRole(roles);
}

/**
 * RayCast algorithm for checking whether the point is inside a polygon or not.
 * https://gist.github.com/isedgar/1f5c5b4cf34a43d4db15f9b4fe58b04f
 */
export function checkIfPointIsInsidePolygon(point: GeoJSON.Point, polygon: GeoJSON.Polygon) {
    let in_inside = false
    let x = point.coordinates[0]
    let y = point.coordinates[1]

    let polygonCoordinates = polygon.coordinates[0];
    let polygonCoordinatesLength = polygon.coordinates[0].length;

    for (var i = 0; i < polygonCoordinatesLength - 1; ++i) {
        let x1 = polygonCoordinates[i][0];
        let x2 = polygonCoordinates[i + 1][0];
        let y1 = polygonCoordinates[i][1];
        let y2 = polygonCoordinates[i + 1][1];

        if (y < y1 != y < y2 && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) {
            in_inside = !in_inside;
        }
    }

    return in_inside;
}

export function checkIfPolygonIsInsideAnotherPolygon(polygon: GeoJSON.Polygon, parentPolygon: GeoJSON.Polygon) {
    let polygonCorrodinates = polygon.coordinates[0];

    return polygonCorrodinates.every((coordinates) => checkIfPointIsInsidePolygon({ type: "Point", coordinates } as GeoJSON.Point, parentPolygon))
}

export function convertBooleanStringToBoolean(value: any): boolean {
    return (value === true || value === "true" || value === "True")
}