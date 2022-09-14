import * as React from 'react'
import { useHistory } from 'react-router-dom';
import { allAphabetsAndNumber } from '../../regex';
import { IContextProvider } from '../../uxp';
import CrudComponent from '../common/CrudComponent/CrudComponent';

interface IVehicleModelsProps { uxpContext: IContextProvider }

export interface IVehicleModel {
    id: string,
    name: string;
    brandName: string;
    manufacturerName: string;
    modelName: string;
    height: number;
    width: number;
    published: boolean;
}

const VehicleModels: React.FunctionComponent<IVehicleModelsProps> = (props) => {

    const { uxpContext } = props;

    const [manufacturers, setManufacturers] = React.useState([]);

    const getManufacturers = React.useCallback(async () => {
        try {
            const result = await uxpContext.executeAction("Vehicle", "vehicle_manufacturerAll", {}, { json: true });
            const manufacturerList = result?.data.map((item: any) => ({ label: item.name, value: item.name }));
            manufacturerList.unshift({ label: "--select manufacture--", value: "" })
            setManufacturers(manufacturerList);
        } catch (err) { console.error(err); }
    }, [uxpContext])

    React.useEffect(() => {
        getManufacturers();
    }, [getManufacturers])

    let history = useHistory()

    let memorizedRoles = React.useMemo(() => {
        return {
            list: ["canviewvehiclemodel"],
            add: ["cancreatevehiclemodel"],
            edit: ["canupdatevehiclemodel"],
            delete: ["candeletevehiclemodel"]
        }
    }, [])

    return <div className="page-content">
        <CrudComponent
            entityName='Vehicle Model'
            uxpContext={uxpContext}
            roles={memorizedRoles}
            list={{
                default: {
                    model: "Vehicle",
                    action: "vehicle_modelAll",
                    itemId: "id",
                    responseCodes: {
                        successCode: 101801,
                        errorCodes: {
                            101802: [
                                { error: 'ERR_FETCHING_VEHICLE_MODEL', message: 'Unable to get vehicle model. Something went wrong' }
                            ]
                        }
                    },
                    columns: [
                        {
                            name: "Name",
                            valueField: "name",
                            columnWidth: ''
                        },
                        {
                            name: "Brand Name",
                            valueField: "brandName",
                            columnWidth: ''
                        },
                        {
                            name: "Model Name",
                            valueField: "modelName",
                            columnWidth: ''
                        },
                        {
                            name: "Manufacturer Name",
                            valueField: "manufacturerName",
                            columnWidth: ''
                        },
                        {
                            name: "Height (in mts)",
                            valueField: "height",
                            columnWidth: ''
                        },
                        {
                            name: "Width (in mts)",
                            valueField: "width",
                            columnWidth: ''
                        },
                        {
                            name: "Published",
                            valueField: "published",
                            renderColumn: (item) => <div>{item["published"] ? "Yes" : "No"}</div>,
                            columnWidth: ''
                        }
                    ],
                    deleteItem: {
                        model: "Vehicle",
                        action: "vehicle_modelDelete",
                        responseCodes: {
                            successCode: 101801,
                            successMessage: "Vehicle deleted",
                            errorCodes: {
                                101802: [
                                    { error: 'ERR_DELETING_VEHICLE_MODEL', message: 'Unable to delete vehicle model. Something went wrong' },
                                    { error: 'ERR_VEHICLE_MODEL_IN_USE', message: 'Unable to delete vehicle model. Vehicle model is in use' },
                                    { error: 'ERR_VEHICLE_MODEL_NOT_FOUND', message: 'Unable to delete vehicle model. No vehicle model found' }
                                ]
                            }
                        }
                    },
                    toolbar: {
                        search: {
                            show: true,
                            searchableFields: ["name", "brandName", "modelName", "manufacturerName", "height", "width", "published"]
                        }
                    }
                }
            }}
            add={{
                default: {
                    model: "Vehicle",
                    action: "vehicle_modelCreate",
                    responseCodes: {
                        successCode: 101801,
                        successMessage: "Vehicle created",
                        errorCodes: {
                            101802: [
                                { error: 'ERR_NAME_IS_EMPTY', message: 'Unable to create vehicle mode. Name is required' },
                                { error: 'ERR_NAME_ALREADY_EXISTS', message: 'Unable to create vehicle mode. Name is already exists' },
                                { error: 'ERR_BRAND_NAME_IS_EMPTY', message: 'Unable to create vehicle mode. Brand name is required' },
                                { error: 'ERR_MANUFACTURER_NAME_IS_EMPTY', message: 'Unable to create vehicle mode. Manufacturer name is required' },
                                { error: 'ERR_MODEL_NAME_IS_EMPTY', message: 'Unable to create vehicle mode. Model name is required' },
                                { error: 'ERR_HEIGHT_IS_EMPTY', message: 'Unable to create vehicle mode. Height is required' },
                                { error: 'ERR_WIDTH_IS_EMPTY', message: 'Unable to create vehicle mode. Width is required' },
                                { error: 'ERR_CREATING_VEHICLE_MODEL', message: 'Unable to create vehicle mode. Something went wrong' }
                            ]
                        }
                    },
                    formStructure: [
                        {
                            name: "name",
                            label: "Name",
                            type: "string",
                            validate: {
                                required: true,
                                regExp: allAphabetsAndNumber
                            }
                        },
                        {
                            label: "Brand Name",
                            name: "brandName",
                            type: "string",
                            validate: {
                                required: true,
                                regExp: allAphabetsAndNumber
                            }
                        },
                        {
                            label: "Model Name",
                            name: "modelName",
                            type: "string",
                            validate: {
                                required: true,
                                regExp: allAphabetsAndNumber
                            }
                        },
                        {
                            label: "Manufacturer Name",
                            name: "manufacturerName",
                            type: "select",
                            options: manufacturers,
                            validate: {
                                required: true,
                                regExp: allAphabetsAndNumber
                            }
                        },
                        {
                            label: "Height (in mts)",
                            name: "height",
                            type: "number",
                            validate: {
                                required: true
                            }
                        },
                        {
                            label: "Width (in mts)",
                            name: "width",
                            type: "number",
                            validate: {
                                required: true
                            }
                        }
                    ],
                    afterSave: () => { history.push("/vehicle-model") },
                    onCancel: () => { history.push("/vehicle-model") }
                }
            }}
            edit={{
                default: {
                    getDetails: {
                        model: "Vehicle",
                        action: "vehicle_modelDetails",
                        responseCodes: {
                            successCode: 101801,
                            errorCodes: {
                                101802: [
                                    { error: 'ERR_VEHICLE_MODEL_NOT_FOUND', message: 'Unable to get Vehicle model details. No Vehicle model found.' },
                                    { error: 'ERR_FETCHING_DETAILS', message: 'Unable to get Vehicle model details. Something went wrong.' }
                                ]
                            }
                        }
                    },
                    model: "Vehicle",
                    action: "vehicle_modelUpdate",
                    responseCodes: {
                        successCode: 101801,
                        successMessage: "Vehicle updated",
                        errorCodes: {
                            101802: [
                                { error: 'ERR_VEHICLE_MODEL_NOT_FOUND', message: 'Unable to update vehicle model. No vehicle model found.' },
                                { error: 'ERR_NAME_IS_EMPTY', message: 'Unable to update vehicle mode. Name is required' },
                                { error: 'ERR_NAME_ALREADY_EXISTS', message: 'Unable to update vehicle mode. Name is already exists' },
                                { error: 'ERR_BRAND_NAME_IS_EMPTY', message: 'Unable to update vehicle mode. Brand name is required' },
                                { error: 'ERR_MANUFACTURER_NAME_IS_EMPTY', message: 'Unable to update vehicle mode. Manufacturer name is required' },
                                { error: 'ERR_MODEL_NAME_IS_EMPTY', message: 'Unable to update vehicle mode. Model name is required' },
                                { error: 'ERR_HEIGHT_IS_EMPTY', message: 'Unable to update vehicle mode. Height is required' },
                                { error: 'ERR_WIDTH_IS_EMPTY', message: 'Unable to update vehicle mode. Width is required' },
                                { error: 'ERR_CREATING_VEHICLE_MODEL', message: 'Unable to update vehicle mode. Something went wrong' }
                            ]
                        }
                    },
                    formStructure: [
                        {
                            name: "name",
                            label: "Name",
                            type: "string",
                            validate: {
                                required: true,
                                regExp: allAphabetsAndNumber
                            }
                        },
                        {
                            label: "Brand Name",
                            name: "brandName",
                            type: "string",
                            validate: {
                                required: true,
                                regExp: allAphabetsAndNumber
                            }
                        },
                        {
                            label: "Model Name",
                            name: "modelName",
                            type: "string",
                            validate: {
                                required: true,
                                regExp: allAphabetsAndNumber
                            }
                        },
                        {
                            label: "Manufacturer Name",
                            name: "manufacturerName",
                            type: "select",
                            options: manufacturers,
                            validate: {
                                required: true,
                                regExp: allAphabetsAndNumber
                            }
                        },
                        {
                            label: "Height (in mts)",
                            name: "height",
                            type: "number",
                            validate: {
                                required: true
                            }
                        },
                        {
                            label: "Width (in mts)",
                            name: "width",
                            type: "number",
                            validate: {
                                required: true
                            }
                        }
                    ],
                    afterSave: () => { history.push("/vehicle-model") },
                    onCancel: () => { history.push("/vehicle-model") }
                }
            }}

        />

    </div>
}

export default VehicleModels