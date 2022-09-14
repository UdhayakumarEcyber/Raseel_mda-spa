import * as React from 'react'
import { useHistory } from 'react-router-dom';
import { allAphabetsAndNumber } from '../../regex';
import { IContextProvider } from '../../uxp';
import CrudComponent from '../common/CrudComponent/CrudComponent';

interface IManufacturersProps { uxpContext: IContextProvider }

const Manufacturers: React.FunctionComponent<IManufacturersProps> = (props) => {

    let history = useHistory()
    // console.log("history ", history);

    return <div className="page-content">
        <CrudComponent
            entityName='Manufacturer'
            uxpContext={props.uxpContext}
            roles={{
                list: ["canviewmanufacturer"],
                add: ["cancreatemanufacturer"],
                edit: ["canupdatemanufacturer"],
                delete: ["candeletemanufacturer"]
            }}
            list={{
                default: {
                    model: "Vehicle",
                    action: "vehicle_manufacturerAll",
                    itemId: "id",
                    responseCodes: {
                        successCode: 101801,
                        errorCodes: {
                            101802: [
                                { error: 'ERR_FETCHING_VEHICLE_MANUFACTURER', message: 'Unable to get manufacturers. Something went wrong' }
                            ]
                        }
                    },
                    columns: [
                        {
                            name: "Name",
                            valueField: "name",
                            columnWidth: '70%'
                        }
                    ],
                    deleteItem: {
                        model: "Vehicle",
                        action: "vehicle_manufacturerDelete",
                        responseCodes: {
                            successCode: 101801,
                            successMessage: "Manufacturer deleted",
                            errorCodes: {
                                101802: [
                                    { error: 'ERR_DELETING_VEHICLE_MANUFACTURER', message: 'Unable to delete manufacturer. Something went wrong' },
                                    { error: 'ERR_VEHICLE_MANUFACTURER_IN_USE', message: 'Unable to delete manufacturer. Manufacturer is in use' },
                                    { error: 'ERR_VEHICLE_MANUFACTURER_NOT_FOUND', message: 'Unable to delete manufacturer. No manufacturer found' }
                                ]
                            }
                        }
                    },
                    toolbar: {
                        search: {
                            show: true,
                            searchableFields: ["name"]
                        }
                    }
                }
            }}
            add={{
                default: {
                    model: "Vehicle",
                    action: "vehicle_manufacturerCreate",
                    responseCodes: {
                        successCode: 101801,
                        successMessage: "Manufacturer created",
                        errorCodes: {
                            101802: [
                                { error: 'ERR_NAME_IS_EMPTY', message: 'Unable to create manufaturer. Name is required' },
                                { error: 'ERR_NAME_ALREADY_EXISTS', message: 'Unable to create manufaturer. Name is already exists' },
                                { error: 'ERR_CREATING_VEHICLE_MANUFACTURER', message: 'Unable to create manufaturer. Something went wrong' }
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
                        }
                    ],
                    afterSave: () => { history.push("/manufacturers") },
                    onCancel: () => { history.push("/manufacturers") }
                }
            }}
            edit={{
                default: {
                    getDetails: {
                        model: "Vehicle",
                        action: "vehicle_manufacturerDetails",
                        responseCodes: {
                            successCode: 101801,
                            errorCodes: {
                                101802: [
                                    { error: 'ERR_VEHICLE_MANUFACTURER_NOT_FOUND', message: 'Unable to get manufacturer details. No manufacturer found.' },
                                    { error: 'ERR_FETCHING_DETAILS', message: 'Unable to get manufacturer details. Something went wrong.' }
                                ]
                            }
                        }
                    },
                    model: "Vehicle",
                    action: "vehicle_manufacturerUpdate",
                    responseCodes: {
                        successCode: 101801,
                        successMessage: "Manufacturer updated",
                        errorCodes: {
                            101802: [
                                { error: 'ERR_VEHICLE_MANUFACTURER_NOT_FOUND', message: 'Unable to update manufacturer. No manufacturer found.' },
                                { error: 'ERR_UPDATING_VEHICLE_MANUFACTURER', message: 'Unable to update manufacturer. Something went wrong.' },
                            ],
                            103502: [
                                { error: 'ERR_NAME_IS_EMPTY', message: 'Unable to create manufaturer. Name is required.' },
                                { error: 'ERR_NAME_ALREADY_EXISTS', message: 'Unable to update manufaturer. Name is already exists.' },
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
                        }
                    ],
                    afterSave: () => { history.push("/manufacturers") },
                    onCancel: () => { history.push("/manufacturers") }
                }
            }}

        />

    </div>
}

export default Manufacturers