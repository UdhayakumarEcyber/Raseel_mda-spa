import * as React from 'react'
import { useHistory, useParams } from 'react-router-dom';
import { IOption, Loading, NotificationBlock, useToast } from 'uxp/components';
import { IFormFieldDefinition } from '../../../crud-component';
import { allAphabetsAndNumber } from '../../regex';
import { handleErrorResponse, handleSuccessResponse } from '../../utils';
import { IContextProvider } from '../../uxp';
import { Conditional } from '../common/ConditionalComponent';
import DynamicFormComponent from '../common/CrudComponent/components/DynamicFormComponent';
import CrudComponent from '../common/CrudComponent/CrudComponent';
import { fetchOffStreetParking, offStreetParkingOptions } from '../Devices/Properties';
import { fetchParkingGroups, IParkingGroup } from '../ParkingInformation/ParkingGroup';

interface IParkingAccessProps { uxpContext: IContextProvider }

const category = [{ value: 'entrance', label: 'Entrance' }, { value: 'exit', label: 'Exit' }, { value: 'emergency', label: 'Emergency' }]


const ParkingAccess: React.FunctionComponent<IParkingAccessProps> = (props) => {

    const { uxpContext } = props;

    const [parkingGroupOption, setParkingGroupOptions] = React.useState<IParkingGroup[]>(null)
    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    React.useEffect(() => {
        const fetch = async () => {

            const group = await fetchParkingGroups(uxpContext)
            const offStreetParking = group.filter(g => g["ParkingGroup.category"] === "OffStreetParking");
            setParkingGroupOptions(offStreetParking)
            setIsLoading(false);
        }
        fetch()
    }, [])

    const mapActionData = React.useCallback((item) => {
        if (!parkingGroupOption) return item;
        let group = parkingGroupOption.find(g => g["ParkingGroup.id"] === item["ParkingAccess.refOffStreetParking"])
        if (group) {
            item = {
                ...item,
                "ParkingAccess.refOffStreetParking": group["ParkingGroup.name"]?.toUpperCase()
            }
        }
        return item;
    }, [parkingGroupOption])

    let memorizedRoles = React.useMemo(() => {
        return {
            list: ["canviewparkingaccess"],
            add: ["cancreateparkingaccess"],
            edit: ["canupdateparkingaccess"],
            delete: ["candeleteparkingaccess"],
        }
    }, [])

    return <>
        <Conditional visible={isLoading}>
            <div className="loading-text">
                <Loading />
                <span style={{ marginTop: '20px' }}>Loading Parking Access</span>
            </div>
        </Conditional>

        <Conditional visible={!isLoading && !!parkingGroupOption}>
            <div className="page-content">
                <CrudComponent
                    entityName='Parking Access'
                    uxpContext={uxpContext}
                    roles={memorizedRoles}
                    list={{
                        default: {
                            model: "ParkingAccess",
                            action: "accessAll",
                            itemId: "ParkingAccess.id",
                            mapActionData,
                            responseCodes: {
                                successCode: 103601,
                                errorCodes: {
                                    103602: [
                                        { error: 'ERR_FETCHING_GROUPS', message: 'Unable to get Parking Access. Something went wrong' }
                                    ]
                                }
                            },
                            // "ParkingAccess.id"
                            // "ParkingAccess.name"
                            // "ParkingAccess.category"
                            // "ParkingAccess.address"
                            // "ParkingAccess.height"
                            // "ParkingAccess.width"
                            // "ParkingAccess.slope"
                            // "ParkingAccess.refOffStreetParking"
                            // "ParkingAccess.location"
                            columns: [
                                {
                                    name: "Access Name",
                                    valueField: "ParkingAccess.name",
                                    columnWidth: ''
                                },
                                {
                                    name: "Category",
                                    valueField: "ParkingAccess.category",
                                    columnWidth: ''
                                },
                                {
                                    name: "Address",
                                    valueField: "ParkingAccess.address",
                                    columnWidth: ''
                                },
                                {
                                    name: "Height (in mts)",
                                    valueField: "ParkingAccess.height",
                                    columnWidth: ''
                                },
                                {
                                    name: "Width (in mts)",
                                    valueField: "ParkingAccess.width",
                                    columnWidth: ''
                                },
                                {
                                    name: "Slope",
                                    valueField: "ParkingAccess.slope",
                                    columnWidth: ''
                                },
                                {
                                    name: "OffStreet Parking",
                                    valueField: "ParkingAccess.refOffStreetParking",
                                    columnWidth: ''
                                }
                            ],
                            deleteItem: {
                                model: "ParkingAccess",
                                action: "accessDelete",
                                responseCodes: {
                                    successCode: 103601,
                                    successMessage: "Parking Access deleted",
                                    errorCodes: {
                                        103602: [
                                            { error: 'ERR_PARKING_ACCESS_NOT_FOUND', message: 'Unable to delete Parking Access. Something went wrong' },
                                            { error: 'ERR_DELETING_PARKING_ACCESS', message: 'Unable to delete Parking Access. No Parking Access found' }
                                        ]
                                    }
                                }
                            },
                            toolbar: {
                                search: {
                                    show: true,
                                    searchableFields: [
                                        "ParkingAccess.name", 
                                        "ParkingAccess.category",
                                        "ParkingAccess.address",
                                        "ParkingAccess.refOffStreetParking",
                                        "ParkingAccess.height",
                                        "ParkingAccess.width",
                                        "ParkingAccess.slope"
                                    ]
                                }
                            }
                        }
                    }}
                    add={{
                        renderCustom: CreateParkingAccess
                    }}
                    edit={{
                        renderCustom: EditParkingAccess
                    }}
                />
            </div>
        </Conditional>
    </>
}


const CreateParkingAccess: React.FunctionComponent<{ uxpContext: IContextProvider }> = (props) => {
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [parkingGroup, setParkingGroup] = React.useState<IParkingGroup[]>(null);
    const [offGroupOptions, setOffGroupOptions] = React.useState<IOption[]>([])
    const [groupLocation, setGroupLocation] = React.useState<GeoJSON.Polygon>(null)
    const [selectedGroupName, setSelectedGroupName] = React.useState<string>("");
    const [error, setError] = React.useState(null)
    const [formData, setFormData] = React.useState<any>({})
    const [zoom, setZoom] = React.useState<number>(14);

    const toast = useToast();
    let history = useHistory()

    let responseCodes = {
        successCode: 103601,
        successMessage: "Parking Access created",
        errorCodes: {
            103602: [
                { error: 'ERR_NAME_IS_EMPTY', message: 'Unable to create Parking Access. Name is required' },
                { error: 'ERR_NAME_ALREADY_EXISTS', message: 'Unable to create Parking Access. Name is already exists' },
                { error: 'ERR_CATEGORY_IS_EMPTY', message: 'Unable to create Parking Access. Category is required' },
                { error: 'ERR_CATEGORY_IS_INVALID', message: 'Unable to create Parking Access. Invalid Category' },
                { error: 'ERR_REF_PARKING_GROUP_IS_EMPTY', message: 'Unable to create Parking Access. Parking Group is required' },
                { error: 'ERR_REF_PARKING_GROUP_IS_INVALID', message: 'Unable to create Parking Access. Invalid Parking Group' },
                { error: 'ERR_LOCATION_IS_EMPTY', message: 'Unable to create Parking Access. Location is required' },
                { error: 'ERR_LOCATION_IS_INVALID', message: 'Unable to create Parking Access. Invalid Location' },
                { error: 'ERR_CREATING_PARKING_ACCESS', message: 'Unable to create Parking Access. Something went wrong' }
            ]
        }
    }

    React.useEffect(() => {
        getOffStreetOptions()
    }, [])

    const getOffStreetOptions = async () => {
        try {
            const offStreetParking = await fetchOffStreetParking(uxpContext)
            setParkingGroup(offStreetParking);
            const offGroupOptions = await offStreetParkingOptions(uxpContext, offStreetParking);
            setOffGroupOptions(offGroupOptions);
            setIsLoading(false);
        }
        catch (err) {
            toast.error('Error while retrieving parking informations. Please refresh...');
        }
    }

    React.useEffect(() => {
        if (formData?.["ParkingAccess.refOffStreetParking"]) {
            let group = parkingGroup.find(p => p?.["ParkingGroup.id"] === formData?.["ParkingAccess.refOffStreetParking"])
            console.log(group?.["ParkingGroup.location"])
            setGroupLocation(group?.["ParkingGroup.location"]);
            setSelectedGroupName(group?.["ParkingGroup.name"]);
        }
    }, [formData])

    async function handleSubmit(data: any) {
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction("ParkingAccess", "accessCreate", { ...data }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `Parking access Created`)

                        history.push("/parking-access")
                        return
                    }

                    nope("")
                    toast.error("Invalid Response")
                })
                .catch(e => {
                    console.log("Exception:", e);
                    nope(e)
                    let { valid, msg } = handleErrorResponse(e, responseCodes.errorCodes)
                    toast.error(msg)
                })
        })
    }

    function handleCancel() {
        history.push("/parking-access")
    }

    function getValue(field: string) {
        let value = ""
        if (formData && formData[field]) {
            value = formData[field]
        }

        return value
    }

    let structure: IFormFieldDefinition[] = [
        {
            label: "Access Name",
            name: "ParkingAccess.name",
            type: "string",
            validate: {
                required: true,
                regExp: allAphabetsAndNumber
            },
            value: getValue("ParkingAccess.name")
        },
        {
            label: "Category",
            name: "ParkingAccess.category",
            type: "select",
            options: category,
            validate: {
                required: true
            },
            value: getValue("ParkingAccess.category")
        },
        {
            label: "Address",
            name: "ParkingAccess.address",
            type: "string",
            value: getValue("ParkingAccess.address")
        },
        {
            label: "Height (in mts)",
            name: "ParkingAccess.height",
            type: "number",
            value: getValue("ParkingAccess.height")
        },
        {
            label: "Width (in mts)",
            name: "ParkingAccess.width",
            type: "number",
            value: getValue("ParkingAccess.width")
        },
        {
            label: "Slope",
            name: "ParkingAccess.slope",
            type: "number",
            value: getValue("ParkingAccess.slope")
        },
        {
            label: "OffStreet Parking",
            name: "ParkingAccess.refOffStreetParking",
            type: "select",
            options: offGroupOptions,
            validate: {
                required: true
            },
            value: getValue("ParkingAccess.refOffStreetParking")
        },
        {
            label: "Location",
            buttonLabel: "Draw",
            name: "ParkingAccess.location",
            type: "map",
            location: {
                mapType: "Polygon",
                regions: groupLocation,
                regionsName: selectedGroupName,
                locationTitle: getValue("ParkingAccess.name"),
                zoom,
                setZoom
            },
            validate: {
                required: true
            },
            value: getValue("ParkingAccess.location")
        }
    ]

    return <> <Conditional visible={isLoading} > <Loading /> </Conditional>
        <Conditional visible={error != null} > <NotificationBlock message={error} /> </Conditional>
        <Conditional visible={!isLoading && error == null} >
            <DynamicFormComponent
                formStructure={structure}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onChange={(prevData, newData) => {
                    setFormData(newData)
                    return newData
                }}
            />
        </Conditional>
    </>
}

const EditParkingAccess: React.FunctionComponent<{ uxpContext: IContextProvider }> = (props) => {
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [parkingGroup, setParkingGroup] = React.useState<IParkingGroup[]>([]);
    const [offGroupOptions, setOffGroupOptions] = React.useState<IOption[]>([])
    const [groupLocation, setGroupLocation] = React.useState<GeoJSON.Polygon>(null)
    const [selectedGroupName, setSelectedGroupName] = React.useState<string>("");
    const [error, setError] = React.useState(null)
    const [formData, setFormData] = React.useState<any>({})
    const [zoom, setZoom] = React.useState<number>(20);

    const toast = useToast();
    let history = useHistory()
    let { id: _id } = useParams<{ id: string }>()

    let detailsResponseCodes = {
        successCode: 103601,
        errorCodes: {
            103602: [
                { error: 'ERR_PARKING_ACCESS_NOT_FOUND', message: 'Unable to get parking access details. No parking access found.' },
                { error: 'ERR_FETCHING_DETAILS', message: 'Unable to get parking access details. Something went wrong.' }
            ]
        }
    }


    let responseCodes = {
        successCode: 103601,
        successMessage: "Parking Access updated",
        errorCodes: {
            103602: [
                { error: 'ERR_PARKING_ACCESS_NOT_FOUND', message: 'Unable to update Parking Access. No Parking Access found.' },
                { error: 'ERR_NAME_IS_EMPTY', message: 'Unable to update Parking Access. Name is required' },
                { error: 'ERR_NAME_ALREADY_EXISTS', message: 'Unable to update Parking Access. Name is already exists' },
                { error: 'ERR_CATEGORY_IS_EMPTY', message: 'Unable to update Parking Access. Category is required' },
                { error: 'ERR_CATEGORY_IS_INVALID', message: 'Unable to update Parking Access. Invalid Category' },
                { error: 'ERR_REF_PARKING_GROUP_IS_EMPTY', message: 'Unable to update Parking Access. Parking Group is required' },
                { error: 'ERR_REF_PARKING_GROUP_IS_INVALID', message: 'Unable to update Parking Access. Invalid Parking Group' },
                { error: 'ERR_LOCATION_IS_EMPTY', message: 'Unable to update Parking Access. Location is required' },
                { error: 'ERR_LOCATION_IS_INVALID', message: 'Unable to update Parking Access. Invalid Location' },
                { error: 'ERR_UPDATING_PARKING_ACCESS', message: 'Unable to update Parking Access. Something went wrong' }
            ]
        }
    }


    React.useEffect(() => {
        getOffStreetOptions()
    }, [])

    const getOffStreetOptions = async () => {
        try {
            const offStreetParking = await fetchOffStreetParking(uxpContext)
            setParkingGroup(offStreetParking);
            const offGroupOptions = await offStreetParkingOptions(uxpContext, offStreetParking);
            setOffGroupOptions(offGroupOptions);
            setIsLoading(false);
        }
        catch (err) {
            toast.error('Error while retrieving parking informations. Please refresh...');
        }
    }

    React.useEffect(() => {
        getItemDetails()
    }, [_id])

    React.useEffect(() => {
        if (formData?.["ParkingAccess.refOffStreetParking"]) {
            let group = parkingGroup.find(p => p?.["ParkingGroup.id"] === formData?.["ParkingAccess.refOffStreetParking"])
            setGroupLocation(group?.["ParkingGroup.location"]);
            setSelectedGroupName(group?.["ParkingGroup.name"]);
        }
    }, [formData, parkingGroup])

    function getItemDetails() {
        if (_id && _id.trim().length > 0) {
            setIsLoading(true)
            uxpContext.executeAction("ParkingAccess", "accessDetails", { id: _id }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, detailsResponseCodes.successCode)
                    if (valid) {
                        if (data) {
                            setFormData(data)
                            setIsLoading(false)
                            return
                        }
                    }
                    setIsLoading(false)
                    toast.error("Invalid Response")
                    setError("Invalid Response")

                })
                .catch(e => {
                    console.log(`Unable to get Parking access details. Exception: `, e);
                    let { valid, msg } = handleErrorResponse(e, detailsResponseCodes.errorCodes)
                    toast.error(msg)
                    setError(msg)
                    setIsLoading(false)
                })
        }
    }

    async function handleSubmit(data: any) {
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction("ParkingAccess", "accessUpdate", { ...data, id: _id }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `Parking Access updated`)

                        history.push("/parking-access")
                        return
                    }

                    nope("")
                    toast.error("Invalid Response")
                })
                .catch(e => {
                    console.log("Exception:", e);
                    nope(e)
                    let { valid, msg } = handleErrorResponse(e, responseCodes.errorCodes)
                    toast.error(msg)
                })
        })
    }

    function handleCancel() {
        history.push("/parking-access")
    }

    function getValue(field: string) {
        let value = ""
        if (formData && formData[field]) {
            value = formData[field]
        }

        return value
    }

    let structure: IFormFieldDefinition[] = [
        {
            label: "Access Name",
            name: "ParkingAccess.name",
            type: "string",
            validate: {
                required: true,
                regExp: allAphabetsAndNumber
            },
            value: getValue("ParkingAccess.name")
        },
        {
            label: "Category",
            name: "ParkingAccess.category",
            type: "select",
            options: category,
            validate: {
                required: true
            },
            value: getValue("ParkingAccess.category")
        },
        {
            label: "Address",
            name: "ParkingAccess.address",
            type: "string",
            value: getValue("ParkingAccess.address")
        },
        {
            label: "Height (in mts)",
            name: "ParkingAccess.height",
            type: "number",
            value: getValue("ParkingAccess.height")
        },
        {
            label: "Width (in mts)",
            name: "ParkingAccess.width",
            type: "number",
            value: getValue("ParkingAccess.width")
        },
        {
            label: "Slope",
            name: "ParkingAccess.slope",
            type: "number",
            value: getValue("ParkingAccess.slope")
        },
        {
            label: "OffStreet Parking",
            name: "ParkingAccess.refOffStreetParking",
            type: "select",
            options: offGroupOptions,
            validate: {
                required: true
            },
            value: getValue("ParkingAccess.refOffStreetParking")
        },
        {
            label: "Location",
            buttonLabel: "Draw",
            name: "ParkingAccess.location",
            type: "map",
            location: {
                mapType: "Polygon",
                regions: groupLocation,
                regionsName: selectedGroupName,
                locationTitle: getValue("ParkingAccess.name"),
                zoom,
                setZoom
            },
            validate: {
                required: true
            },
            value: getValue("ParkingAccess.location")
        }
    ]

    return <> <Conditional visible={isLoading} > <Loading /> </Conditional>
        <Conditional visible={error != null} > <NotificationBlock message={error} /> </Conditional>
        <Conditional visible={!isLoading && error == null} >
            <DynamicFormComponent
                formStructure={structure}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onChange={(prevData, newData) => {
                    setFormData(newData)
                    return newData
                }}
            />
        </Conditional>
    </>
}


export default ParkingAccess