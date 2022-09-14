import * as React from 'react'
import { useHistory, useParams } from 'react-router-dom';
import { IOption, Loading, NotificationBlock, useToast } from 'uxp/components';
import { IFormFieldDefinition, IFormFieldType } from '../../../crud-component';
import { handleErrorResponse, handleSuccessResponse } from '../../utils';
import { IContextProvider } from '../../uxp';
import { Conditional } from '../common/ConditionalComponent';
import DynamicFormComponent from '../common/CrudComponent/components/DynamicFormComponent';
import CrudComponent from '../common/CrudComponent/CrudComponent';
import { fetchParkingOperator, IParkingOperator } from '../Devices/Properties';
import { fetchAllVehicles, IVehicle } from '../Drivers/VehicleDetailsModal';
import { fetchParkingGroups, IParkingGroup } from '../ParkingInformation/ParkingGroup';
import { fetchAllParkingSites, IParkingSite } from '../ParkingInformation/ParkingSite';
import { fetchAllUsers, IUser } from '../Users/User';
import {fetchAllDrivers, IDriver} from "../Drivers/Drivers";

interface IBlacklistsProps { uxpContext: IContextProvider }

const statusOptions = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]

const Blacklists: React.FunctionComponent<IBlacklistsProps> = (props) => {
    const toast = useToast();
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [users, setUsers] = React.useState<IUser[]>([])

    React.useEffect(() => {
        fetchAllUsers(uxpContext).then((users) => {
            setUsers(users);
            setIsLoading(false);
        }).catch((err) => {
            toast.error('Something went wrong while fetching the users....');
        }).finally(() => {
            setIsLoading(false);
        });
    }, [])

    const mapDriverToUser = React.useCallback((driver) => {
        const blacklistingUpdatedBy = users?.find((user) =>driver['Driver.blackListingUpdatedBy'] == user.UserKey);
        const blackListingUpdateAt = new Date(driver["Driver.blackListingUpdateAt"]).toLocaleString()
        return {
            ...driver,
            ["Driver.blackListingUpdatedBy"]: blacklistingUpdatedBy?.FullName || driver["Driver.blackListingUpdatedBy"],
            ["Driver.blackListingUpdateAt"]: blackListingUpdateAt || driver["Driver.blackListingUpdateAt"],
        }

    }, [users])

    let memorizedRoles = React.useMemo(() => {
        return {
            list: ["canviewblacklisteddriver"],
            add: ["canblacklistdriver"],
            edit: ["canunblacklistdriver"],
            delete: [],
        }
    }, [])

    return <>
        <Conditional visible={isLoading}>
            <div className="loading-text">
                <Loading />
                <span>Loading BlackListed</span>
            </div>
        </Conditional>

        <Conditional visible={!isLoading}>

            <div className="page-content">
                <CrudComponent
                    entityName='BlackListed'
                    uxpContext={uxpContext}
                    roles={memorizedRoles}
                    list={{
                        default: {
                            model: "Driver",
                            action: "driverAll",
                            itemId: "id",
                            labels: {
                                add: "Blacklist",
                                edit: "Unblacklist"
                            },
                            actions: {
                                delete: false,
                            },
                            mapActionData: mapDriverToUser,
                            filterData: (data) => {
                                return data.filter(d => d["Driver.blackListed"])
                            },
                            responseCodes: {
                                successCode: 101301,
                                errorCodes: {
                                    101302: [
                                        { error: 'ERR_FETCHING_VIOLATIONS', message: 'Unable to get BlackListed. Something went wrong' }
                                    ]
                                }
                            },
                            // First Name	
                            // Last Name	
                            // Mobile #	
                            // Contact Name	
                            // Email
                            columns: [
                                {
                                    name: "Full Name",
                                    valueField: "contactName",
                                    columnWidth: ''
                                },
                                {
                                    name: "First Name",
                                    valueField: "firstName",
                                    columnWidth: ''
                                },
                                {
                                    name: "Last Name",
                                    valueField: "lastName",
                                    columnWidth: ''
                                },
                                {
                                    name: "Email",
                                    valueField: "email",
                                    columnWidth: ''
                                },
                                {
                                    name: "BlackListed",
                                    valueField: "Driver.blackListed",
                                    columnWidth: '',
                                    renderColumn: (item) => <>{item["Driver.blackListed"] ? "Yes" :"No"}</>
                                },
                                {
                                    name: "Reason",
                                    valueField: "Driver.reason",
                                    columnWidth: '',
                                },
                                {
                                    name: "Updated By",
                                    valueField: "Driver.blackListingUpdatedBy",
                                    columnWidth: ''
                                },
                                {
                                    name: "Update At",
                                    valueField: "Driver.blackListingUpdateAt",
                                    columnWidth: '',
                                }
                            ],
                            toolbar: {
                                search: {
                                    show: true,
                                    searchableFields: [
                                        "title",
                                        "description",
                                        "status",
                                        "parkingGroup",
                                        "operatorId",
                                    ]
                                }
                            }
                        }
                    }}
                    add={{
                        renderCustom: BlacklistDriver
                    }}
                    edit={{
                        renderCustom: UnBlackListDriver 
                    }}

                />
            </div>
        </Conditional>
    </>
}

const BlacklistDriver: React.FunctionComponent<{ uxpContext: IContextProvider, mapDriverToUser:(d: IDriver) => IDriver }> = (props) => {
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    const [drivers, setDrivers] = React.useState<IDriver[]>([])
    const [filteredDrivers, setFilteredDrivers] = React.useState<IDriver[]>([])
    const [vehicles, setVehicles] = React.useState<IVehicle[]>([])

    const [selectedVehicle, setSelectedVehicle] = React.useState("");
    const [selectedDriver, setSelectedDriver] = React.useState("");
    const [reason, setReason] = React.useState("");

    const [error, setError] = React.useState(null)

    const toast = useToast();
    let history = useHistory()

    let responseCodes = {
        successCode: 101301,
        successMessage: "Blacklisted the driver",
        errorCodes: {
            101302: [
                { error: 'ERR_DRIVER_NOT_FOUND', message: 'Driver not found' },
                { error: 'ERR_BLACKLIST_UPDATED_BY_NOT_FOUND', message: 'Updated by not found' },
                { error: 'ERR_UPDATING_DRIVER_BLACKLISTED', message: 'Unable to blacklist the driver' },
            ]
        }
    }

    React.useEffect(() => {
        Promise.all([
            fetchAllVehicles(props.uxpContext),
            fetchAllDrivers(props.uxpContext),
        ]).then((result) => {
            const [vehicles, drivers] = result;
            setVehicles(vehicles);
            setDrivers(drivers)
            setFilteredDrivers(drivers);
            setIsLoading(false);
        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
        })
    }, [])

    async function handleSubmit(data: any) {
        const values = {
            "driverId": data["driverId"],
            "reason": data["reason"],
            "blackListed" : true,
            "blackListingUpdatedBy": uxpContext.userKey
        }
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction("Driver", "updateDriverBlacklisted", { ...values }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `Blacklisted the driver`)

                        history.push("/manage-blacklists")
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
        history.push("/manage-blacklists")
    }

    React.useEffect(() => {
        let vehicle = vehicles.find(v => v["id"] === selectedVehicle);
        let filteredDriver = vehicle?.driverIds?.map(d => drivers.find(driver => driver["id"] == d));
        setFilteredDrivers(filteredDriver)
    }, [selectedVehicle])

    let structure: IFormFieldDefinition[] = [
        {
            label: "Driver",
            name: "driverId",
            type: "select",
            value: selectedDriver,
            options: filteredDrivers,
            labelField: "contactName",
            valueField: "id",
            validate: {
                required: true
            }
        },
        {
            label: "Reason",
            name: "reason",
            type: "string",
            validate: {
                required: true
            },
            value: reason
        },
        {
            label: "Vehicle",
            name: "vehicle",
            type: "select",
            value: selectedVehicle,
            options: vehicles,
            labelField: "Vehicle.vehiclePlateIdentifier",
            valueField: "id"
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
                    setSelectedDriver(newData.driverId);
                    setSelectedVehicle(newData.vehicle);
                    setReason(newData.reason);
                    return newData
                }}
            />
        </Conditional>
    </>
}

const UnBlackListDriver: React.FunctionComponent<{ uxpContext: IContextProvider }> = (props) => {
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState(null)

    const [drivers, setDrivers] = React.useState<IDriver[]>([])
    const [currentDriver, setCurrentDriver] = React.useState<any>(null);
    const [reason, setReason] = React.useState("");

    const toast = useToast();

    let history = useHistory()
    let { id: _id } = useParams<{ id: string }>()

    let responseCodes = {
        successCode: 101301,
        successMessage: "Blacklisted the driver",
        errorCodes: {
            101302: [
                { error: 'ERR_DRIVER_NOT_FOUND', message: 'Driver not found' },
                { error: 'ERR_BLACKLIST_UPDATED_BY_NOT_FOUND', message: 'Updated by not found' },
                { error: 'ERR_UPDATING_DRIVER_BLACKLISTED', message: 'Unable to blacklist the driver' },
            ]
        }
    }

    React.useEffect(() => {
        Promise.all([
            fetchAllDrivers(props.uxpContext),
        ]).then((result) => {
            const [drivers] = result;
            setDrivers(drivers)
            setIsLoading(false);
        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
        })
    }, [])

    async function handleSubmit(data: any) {
        const values = {
            "driverId": _id,
            "reason": data["reason"],
            "blackListed" : false,
            "blackListingUpdatedBy": uxpContext.userKey
        }
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction("Driver", "updateDriverBlacklisted", { ...values }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `Blacklisted the driver`)

                        history.push("/manage-blacklists")
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
        history.push("/manage-blacklists")
    }

    React.useEffect(() => {
        let currentDriver = drivers.find(d => d["id"] == _id);
        setCurrentDriver(currentDriver);
    }, [_id, drivers])

    let structure: IFormFieldDefinition[] = [
        {
            label: "Driver",
            name: "driverId",
            type: "readonly",
            value: currentDriver?.contactName || ""
        },
        {
            label: "Reason",
            name: "reason",
            type: "string",
            validate: {
                required: true
            },
            value: reason
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
                    setReason(newData.reason);
                    return newData
                }}
            />
        </Conditional>
    </>
}

export default Blacklists