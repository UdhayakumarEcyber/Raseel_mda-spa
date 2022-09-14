import * as React from 'react'
import { useHistory, useParams } from 'react-router-dom';
import { IOption, Loading, NotificationBlock, useToast } from 'uxp/components';
import { IFormFieldDefinition } from '../../../crud-component';
import { allAphabetsAndNumber, ipAddress, macAddress } from '../../regex';
import { handleErrorResponse, handleSuccessResponse } from '../../utils';
import { IContextProvider } from '../../uxp';
import { Conditional } from '../common/ConditionalComponent';
import DynamicFormComponent from '../common/CrudComponent/components/DynamicFormComponent';
import CrudComponent from '../common/CrudComponent/CrudComponent';
import { camelCaseToCapitalize, category, fetchOwnerOptions, ICustomOption, property } from './Properties';

interface IDevicesProps { uxpContext: IContextProvider }


const Devices: React.FunctionComponent<IDevicesProps> = (props) => {

    const { uxpContext } = props;
    const [isLoading, setIsLoading] = React.useState(true);
    const [ownerOptions, setOwnerOptions] = React.useState<ICustomOption[]>(null);

    const getOwnerOptions = async () => {
        const Options = await fetchOwnerOptions(uxpContext);
        setOwnerOptions([...Options]);
        setIsLoading(false);
    }

    React.useEffect(() => {
        getOwnerOptions();
    }, [])

    const mapActionData = React.useCallback((item) => {
        if (!ownerOptions) return item;
        let owner = ownerOptions.find(o => o["value"] === item["Device.owner"])

        if (owner) {
            item = {
                ...item,
                "Device.owner": owner.label || item["Device.owner"],
                "Device.category": camelCaseToCapitalize(item["Device.category"]),
                "Device.controlledProperty": camelCaseToCapitalize(item["Device.controlledProperty"])
            }
        }
        return item;
    }, [ownerOptions])

    let memorizedRoles = React.useMemo(() => {
        return {
            add: ["cancreatedevice"],
            edit: ["canupdatedevice"],
            delete: ["candeletedevice"],
            list: ["canviewdevice"]
        }
    }, [])

    return <>
        <Conditional visible={isLoading}>
            <div className="loading-text">
                <Loading />
                <span style={{ marginTop: '20px' }}>Loading Devices </span>
            </div>
        </Conditional>

        <Conditional visible={!isLoading && !!ownerOptions}>
            <div className="page-content">
                <CrudComponent
                    entityName='Devices'
                    uxpContext={uxpContext}
                    roles={memorizedRoles}
                    list={{
                        default: {
                            model: "Devices",
                            action: "devicesAll",
                            itemId: "Device.id",
                            mapActionData,
                            responseCodes: {
                                successCode: 101901,
                                errorCodes: {
                                    101902: [
                                        { error: 'ERR_FETCHING_DEVICES', message: 'Unable to get Devices. Something went wrong' }
                                    ]
                                }
                            },
                            // "Device.owner"
                            // "Device.name"
                            // "Device.description"
                            // "Device.controlledProperty"
                            // "Device.category"
                            // "Device.macAddress"
                            // "Device.ipAddress"
                            // "Device.deviceState"
                            // "Device.value"
                            // "Device.location"
                            columns: [
                                {
                                    name: "Name",
                                    valueField: "Device.name",
                                    columnWidth: '150px'
                                },
                                {
                                    name: "Owner",
                                    valueField: "Device.owner",
                                    columnWidth: '150px',
                                    // renderColumn: (item) => <span>{getOwnerName(item["Device.owner"])}</span>
                                },
                                {
                                    name: "Description",
                                    valueField: "Device.description",
                                    columnWidth: ''
                                },
                                {
                                    name: "Category",
                                    valueField: "Device.category",
                                    columnWidth: ''
                                },
                                {
                                    name: "State",
                                    valueField: "Device.deviceState",
                                    columnWidth: ''
                                },
                                {
                                    name: "Controlled Property",
                                    valueField: "Device.controlledProperty",
                                    columnWidth: ''
                                },
                                {
                                    name: "MacAddress",
                                    valueField: "Device.macAddress",
                                    columnWidth: ''
                                },
                                {
                                    name: "IP Address",
                                    valueField: "Device.ipAddress",
                                    columnWidth: '',
                                },

                                {
                                    name: "Value",
                                    valueField: "Device.value",
                                    columnWidth: ''
                                },
                                // {
                                //     name: "location",
                                //     valueField: "Device.location",
                                //     columnWidth: '',
                                //     // renderColumn: (item) => <LocationPicker
                                //     //     label={"view"}
                                //     //     // marker={item["Device.location"]}
                                //     //     editable={false}
                                //     //     tooltip={item["Device.name"]}
                                //     // // title={`${item["Device.name"]} Location`}
                                //     // />
                                // }
                            ],
                            deleteItem: {
                                model: "Devices",
                                action: "devicesDelete",
                                responseCodes: {
                                    successCode: 101901,
                                    successMessage: "Device deleted",
                                    errorCodes: {
                                        101902: [
                                            { error: 'ERR_DELETING_DEVICE', message: 'Unable to delete device. Something went wrong' },
                                            { error: 'ERR_DEVICE_NOT_FOUND', message: 'Unable to delete device. No device found' }
                                        ]
                                    }
                                }
                            },
                            toolbar: {
                                search: {
                                    show: true,
                                    searchableFields: ["Device.name", "Device.owner", "Device.description", "Device.category", "Device.controlledProperty", "Device.macAddress", "Device.ipAddress", "Device.value", "Device.deviceState"]
                                }
                            }
                        }
                    }}
                    add={{
                        renderCustom: CreateDevice
                    }}
                    edit={{
                        renderCustom: EditDevice
                    }}

                />
            </div>
        </Conditional>
    </>
}

const CreateDevice: React.FunctionComponent<{ uxpContext: IContextProvider }> = (props) => {
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [zoom, setZoom] = React.useState<number>(14);
    const [categoryOptions, setCategoryOptions] = React.useState<IOption[]>(null);
    const [controlledPropertyOptions, setControlledPropertyOptions] = React.useState<IOption[]>(null);
    const [ownerOptions, setOwnerOptions] = React.useState<ICustomOption[]>(null);
    const [ownerLocationName, setOwnerLocationName] = React.useState<string>("");
    const [ownerLocation, setOwnerLocation] = React.useState<GeoJSON.Polygon | GeoJSON.Point>(null);
    const [error, setError] = React.useState(null)
    const [formData, setFormData] = React.useState<any>({})

    const getOwnerOptions = async () => {
        const Options = await fetchOwnerOptions(uxpContext);
        setOwnerOptions([...Options]);
        setIsLoading(false);
    }

    React.useEffect(() => {
        const categoryOptions = category.map((v: string) => ({ label: camelCaseToCapitalize(v), value: v }))
        categoryOptions.unshift({ label: "---select Category---", value: "" })
        setCategoryOptions(categoryOptions);

        const controlledPropertyOptions = property.map((v: string) => ({ label: camelCaseToCapitalize(v), value: v }))
        controlledPropertyOptions.unshift({ label: "---select Controlled Property---", value: "" })
        setControlledPropertyOptions(controlledPropertyOptions);

        getOwnerOptions();
    }, [])

    const toast = useToast();
    let history = useHistory()

    let responseCodes = {
        successCode: 101901,
        successMessage: "Device created",
        errorCodes: {
            101902: [
                { error: 'ERR_OWNER_IS_EMPTY', message: 'Unable to create device. Owner is required' },
                { error: 'ERR_OWNER_FORMAT_IS_INVALID', message: 'Unable to create device. Invalid Owner Format' },
                { error: 'ERR_OWNER_ASSET_TYPE_IS_INVALID', message: 'Unable to create device. Owner Type Is Invalid' },
                { error: 'ERR_OWNER_ASSET_ID_IS_INVALID', message: 'Unable to create device. Owner ID is Invalid' },
                { error: 'ERR_LOCATION_IS_INVALID', message: 'Unable to create device. Invalid Location.' },
                { error: 'ERR_CATEGORY_IS_INVALID', message: 'Unable to create device. Invalid Category' },
                { error: 'ERR_MAC_ADDRESS_IS_INVALID', message: 'Unable to create device. Invalid Mac Address' },
                { error: 'ERR_MAC_ADDRESS_ALREADY_EXISTS', message: 'Unable to create device. Mac Address is already exists' },
                { error: 'ERR_LOCATION_IS_EMPTY', message: 'Unable to create device. Location is required' },
                { error: 'ERR_NAME_IS_EMPTY', message: 'Unable to create device. Name is required' },
                { error: 'ERR_CONTROLLED_PROPERTY_IS_EMPTY', message: 'Unable to create device. Controlled Property is required' },
                { error: 'ERR_CONTROLLED_PROPERTY_IS_INVALID', message: 'Unable to create device. Invalid Controlled Property' },
                { error: 'ERR_DEVICE_STATE_IS_EMPTY', message: 'Unable to create device. Device state is required' },
                { error: 'ERR_VALUE_IS_EMPTY', message: 'Unable to create device. Value is required' },
                { error: 'ERR_CREATING_DEVICE', message: 'Unable to create device. Something went wrong' }
            ]
        }
    }


    React.useEffect(() => {
        if (formData?.["Device.owner"]) {
            const owner = ownerOptions.find(o => o?.value === formData?.["Device.owner"]);
            setOwnerLocation(owner?.location)
            setOwnerLocationName(owner.locationName)
        }
    }, [formData])

    async function handleSubmit(data: any) {
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction("Devices", "devicesCreate", { ...data }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `Devices is Created`)

                        history.push("/devices")
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
        history.push("/devices")
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
            label: "Name",
            name: "Device.name",
            type: "string",
            value: getValue("Device.name"),
            validate: {
                required: true,
                regExp: allAphabetsAndNumber
            }
        },
        {
            name: "Device.owner",
            value: getValue("Device.owner"),
            label: "Owner",
            type: "select",
            options: ownerOptions,
            validate: {
                required: true
            }
        },
        {
            label: "Category",
            name: "Device.category",
            value: getValue("Device.category"),
            type: "select",
            options: categoryOptions,
        },
        {
            label: "State",
            name: "Device.deviceState",
            value: getValue("Device.deviceState"),
            type: "string",
            validate: {
                required: true,
                regExp: allAphabetsAndNumber
            }
        },
        {
            label: "Controlled Property",
            name: "Device.controlledProperty",
            value: getValue("Device.controlledProperty"),
            type: "select",
            options: controlledPropertyOptions,
            validate: {
                required: true
            }
        },
        {
            label: "Mac Address",
            name: "Device.macAddress",
            value: getValue("Device.macAddress"),
            type: "string",
            validate: {
                // required: true,
                regExp: macAddress
            }
        },
        {
            label: "Description",
            name: "Device.description",
            value: getValue("Device.description"),
            type: "string"
        },
        {
            label: "IP Address",
            name: "Device.ipAddress",
            value: getValue("Device.ipAddress"),
            type: "string",
            validate: {
                regExp: ipAddress
            }
        },
        {
            label: "Value",
            name: "Device.value",
            value: getValue("Device.value"),
            type: "number",
            validate: {
                required: true
            }
        },
        {
            label: "Location",
            name: "Device.location",
            value: getValue("Device.location"),
            buttonLabel: "Pick",
            type: "map",
            location: {
                mapType: "Point",
                regions: ownerLocation,
                regionsName: ownerLocationName,
                zoom,
                setZoom,
                locationTitle: getValue("Device.name"),
            },
            validate: {
                required: true
            }
        }
    ]

    return <> <Conditional visible={isLoading} > <Loading /> </Conditional>
        <Conditional visible={error != null}> <NotificationBlock message={error} /> </Conditional>
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

const EditDevice: React.FunctionComponent<{ uxpContext: IContextProvider }> = (props) => {
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [zoom, setZoom] = React.useState<number>(14);
    const [categoryOptions, setCategoryOptions] = React.useState<IOption[]>([]);
    const [controlledPropertyOptions, setControlledPropertyOptions] = React.useState<IOption[]>([]);
    const [ownerOptions, setOwnerOptions] = React.useState<ICustomOption[]>([]);
    const [ownerLocationName, setOwnerLocationName] = React.useState<string>("");
    const [ownerLocation, setOwnerLocation] = React.useState<GeoJSON.Polygon | GeoJSON.Point>(null);
    const [error, setError] = React.useState(null)
    const [formData, setFormData] = React.useState<any>({})

    const getOwnerOptions = async () => {
        const Options = await fetchOwnerOptions(uxpContext);
        setOwnerOptions([...Options]);
        getItemDetails()
    }

    React.useEffect(() => {
        const categoryOptions = category.map((v: string) => ({ label: camelCaseToCapitalize(v), value: v }))
        categoryOptions.unshift({ label: "---select Category---", value: "" })
        setCategoryOptions(categoryOptions);

        const controlledPropertyOptions = property.map((v: string) => ({ label: camelCaseToCapitalize(v), value: v }))
        controlledPropertyOptions.unshift({ label: "---select Controlled Property---", value: "" })
        setControlledPropertyOptions(controlledPropertyOptions);

        getOwnerOptions();
    }, [])

    const toast = useToast();
    let history = useHistory()
    let { id: _id } = useParams<{ id: string }>()

    let detailsResponseCodes = {
        successCode: 101901,
        errorCodes: {
            101902: [
                { error: 'ERR_DEVICE_NOT_FOUND', message: 'Unable to get device details. No device found.' },
                { error: 'ERR_FETCHING_DETAILS', message: 'Unable to get device details. Something went wrong.' }
            ]
        }
    }

    let responseCodes = {
        successCode: 101901,
        successMessage: "device updated",
        errorCodes: {
            101902: [
                { error: 'ERR_DEVICE_NOT_FOUND', message: 'Unable to update device. No device found.' },
                { error: 'ERR_OWNER_IS_EMPTY', message: 'Unable to update device. Owner is required' },
                { error: 'ERR_OWNER_FORMAT_IS_INVALID', message: 'Unable to update device. Invalid Owner Format' },
                { error: 'ERR_OWNER_ASSET_TYPE_IS_INVALID', message: 'Unable to update device. Owner Type Is Invalid' },
                { error: 'ERR_OWNER_ASSET_ID_IS_INVALID', message: 'Unable to update device. Owner ID is Invalid' },
                { error: 'ERR_LOCATION_IS_INVALID', message: 'Unable to update device. Invalid Location.' },
                { error: 'ERR_CATEGORY_IS_INVALID', message: 'Unable to update device. Invalid Category' },
                { error: 'ERR_MAC_ADDRESS_IS_INVALID', message: 'Unable to update device. Invalid Mac Address' },
                { error: 'ERR_MAC_ADDRESS_ALREADY_EXISTS', message: 'Unable to update device. Mac Address is already exists' },
                { error: 'ERR_LOCATION_IS_EMPTY', message: 'Unable to update device. Location is required' },
                { error: 'ERR_NAME_IS_EMPTY', message: 'Unable to update device. Name is required' },
                { error: 'ERR_CONTROLLED_PROPERTY_IS_EMPTY', message: 'Unable to update device. Controlled Property is required' },
                { error: 'ERR_CONTROLLED_PROPERTY_IS_INVALID', message: 'Unable to update device. Invalid Controlled Property' },
                { error: 'ERR_DEVICE_STATE_IS_EMPTY', message: 'Unable to update device. Device state is required' },
                { error: 'ERR_VALUE_IS_EMPTY', message: 'Unable to update device. Value is required' },
                { error: 'ERR_UPDATING_DEVICE', message: 'Unable to update device. Something went wrong' }
            ]
        }
    }

    function getItemDetails() {
        if (_id && _id.trim().length > 0) {
            setIsLoading(true)
            uxpContext.executeAction("Devices", "devicesDetails", { id: _id }, { json: true })
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
                    console.log(`Unable to get Devices details. Exception: `, e);
                    let { valid, msg } = handleErrorResponse(e, detailsResponseCodes.errorCodes)
                    toast.error(msg)
                    setError(msg)
                    setIsLoading(false)
                })
        }
    }


    React.useEffect(() => {
        if (formData?.["Device.owner"]) {
            const owner = ownerOptions?.find(o => o?.value === formData?.["Device.owner"]);
            setOwnerLocation(owner?.location)
            setOwnerLocationName(owner?.locationName)
        }
    }, [formData])

    async function handleSubmit(data: any) {
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction("Devices", "devicesUpdate", { ...data,  id: _id }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `Devices is Updated`)

                        history.push("/devices")
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
        history.push("/devices")
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
            label: "Name",
            name: "Device.name",
            type: "string",
            value: getValue("Device.name"),
            validate: {
                required: true,
                regExp: allAphabetsAndNumber
            }
        },
        {
            name: "Device.owner",
            value: getValue("Device.owner"),
            label: "Owner",
            type: "select",
            options: ownerOptions,
            validate: {
                required: true
            }
        },
        {
            label: "Category",
            name: "Device.category",
            value: getValue("Device.category"),
            type: "select",
            options: categoryOptions,
        },
        {
            label: "State",
            name: "Device.deviceState",
            value: getValue("Device.deviceState"),
            type: "string",
            validate: {
                required: true,
                regExp: allAphabetsAndNumber
            }
        },
        {
            label: "Controlled Property",
            name: "Device.controlledProperty",
            value: getValue("Device.controlledProperty"),
            type: "select",
            options: controlledPropertyOptions,
            validate: {
                required: true
            }
        },
        {
            label: "Mac Address",
            name: "Device.macAddress",
            value: getValue("Device.macAddress"),
            type: "string",
            validate: {
                // required: true,
                regExp: macAddress
            }
        },
        {
            label: "Description",
            name: "Device.description",
            value: getValue("Device.description"),
            type: "string"
        },
        {
            label: "IP Address",
            name: "Device.ipAddress",
            value: getValue("Device.ipAddress"),
            type: "string",
            validate: {
                regExp: ipAddress
            }
        },
        {
            label: "Value",
            name: "Device.value",
            value: getValue("Device.value"),
            type: "number",
            validate: {
                required: true
            }
        },
        {
            label: "Location",
            name: "Device.location",
            value: getValue("Device.location"),
            buttonLabel: "Pick",
            type: "map",
            location: {
                mapType: "Point",
                regions: ownerLocation,
                regionsName: ownerLocationName,
                zoom,
                setZoom,
                locationTitle: getValue("Device.name"),
            },
            validate: {
                required: true
            }
        }
    ]

    return <> <Conditional visible={isLoading} > <Loading /> </Conditional>
        <Conditional visible={error != null}> <NotificationBlock message={error} /> </Conditional>
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

export default Devices