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
import { fetchParkingGroups, IParkingGroup } from '../ParkingInformation/ParkingGroup';
import { fetchAllParkingSites, IParkingSite } from '../ParkingInformation/ParkingSite';

interface IViolationTypesProps { uxpContext: IContextProvider }

const statusOptions = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]

const ViolationTypes: React.FunctionComponent<IViolationTypesProps> = (props) => {
    const toast = useToast();
    const { uxpContext } = props;

    let history = useHistory()

    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    const [parkingGroups, setParkingGroups] = React.useState<IParkingGroup[]>(null);

    const [parkingOperator, setParkingOperator] = React.useState<IParkingOperator[]>(null)

    React.useEffect(() => {
        Promise.all([
            fetchParkingGroups(uxpContext),
            fetchAllParkingSites(uxpContext),
            fetchParkingOperator(uxpContext),
            // fetchP
        ]).then((result) => {
            const [group, sites, operator] = result;
            setParkingGroups(group);
            setParkingOperator(operator);

            setIsLoading(false);

        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
        })
    }, [])

    const mapActionData = React.useCallback((item) => {
        if (!parkingGroups || !parkingOperator) return item;

        let group = parkingGroups?.find(p => p['ParkingGroup.id'] === item['parkingGroup'])
        let operator = parkingOperator?.find(p => p['_id'] === item['operatorId'])

        item = {
            ...item,
            'parkingGroup': group?.["ParkingGroup.name"] || item['parkingGroup'],
            'operatorId': operator?.['companyName'] || item['operatorId']
        }
        return item;

    }, [parkingGroups, parkingOperator])

    let memorizedRoles = React.useMemo(() => {
        return {
            list: ["canviewviolationtype"],
            add: ["cancreateviolationtype"],
            edit: ["canupdateviolationtype"],
            delete: ["candeleteviolationtype"],
        }
    }, [])

    return <>
        <Conditional visible={isLoading}>
            <div className="loading-text">
                <Loading />
                <span>Loading Violation types</span>
            </div>
        </Conditional>

        <Conditional visible={!isLoading && !!parkingGroups && !!parkingOperator}>

            <div className="page-content">
                <CrudComponent
                    entityName='Violation Types'
                    uxpContext={uxpContext}
                    roles={memorizedRoles}
                    list={{
                        default: {
                            model: "ViolationTypes",
                            action: "violationsAll",
                            itemId: "id",
                            mapActionData,
                            responseCodes: {
                                successCode: 103701,
                                errorCodes: {
                                    103702: [
                                        { error: 'ERR_FETCHING_VIOLATIONS', message: 'Unable to get Violation Types. Something went wrong' }
                                    ]
                                }
                            },
                            // title,
                            // operatorId,
                            // description,
                            // amount,
                            // currency,
                            // parkingGroup,
                            // status,
                            columns: [
                                {
                                    name: "Violation Title",
                                    valueField: "title",
                                    columnWidth: ''
                                },
                                {
                                    name: "Description",
                                    valueField: "description",
                                    columnWidth: ''
                                },
                                {
                                    name: "Amount",
                                    valueField: "amount",
                                    columnWidth: ''
                                },
                                {
                                    name: "Currency",
                                    valueField: "currency",
                                    columnWidth: ''
                                },
                                {
                                    name: "Status",
                                    valueField: "status",
                                    columnWidth: ''
                                },
                                {
                                    name: "Parking Group",
                                    valueField: "parkingGroup",
                                    columnWidth: '',
                                },
                                {
                                    name: "Parking Operator",
                                    valueField: "operatorId",
                                    columnWidth: '',
                                }
                            ],
                            deleteItem: {
                                model: "ViolationTypes",
                                action: "violationsDelete",
                                responseCodes: {
                                    successCode: 103701,
                                    successMessage: "Violation type deleted",
                                    errorCodes: {
                                        103702: [
                                            { error: 'ERR_VIOLATION_NOT_FOUND', message: 'Unable to delete Violation type. Something went wrong' },
                                            { error: 'ERR_DELETING_VIOLATION', message: 'Unable to delete Violation type. No Violation type found' }
                                        ]
                                    }
                                }
                            },
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
                        renderCustom: CreateViolation
                    }}
                    edit={{
                        renderCustom: EditViolation
                    }}

                />
            </div>
        </Conditional>
    </>
}

const CreateViolation: React.FunctionComponent<{ uxpContext: IContextProvider }> = (props) => {
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    const [parkingGroups, setParkingGroups] = React.useState<IParkingGroup[]>(null);
    const [parkingSites, setParkingSites] = React.useState<IParkingSite[]>(null);

    const [parkingOperator, setParkingOperator] = React.useState<IParkingOperator[]>(null)
    const [groups, setGroups] = React.useState<string[]>([])
    const [error, setError] = React.useState(null)
    const [formData, setFormData] = React.useState<any>({})

    const toast = useToast();
    let history = useHistory()

    let responseCodes = {
        successCode: 103701,
        successMessage: "Violation type created",
        errorCodes: {
            103702: [
                { error: 'ERR_TITLE_IS_EMPTY', message: 'Unable to create violation type. Title is required' },
                { error: 'ERR_TITLE_IS_ALREADY_EXISTS', message: 'Unable to create violation type. Title is already exists' },
                { error: 'ERR_OPERATOR_ID_IS_EMPTY', message: 'Unable to create violation type. Operator is required' },
                { error: 'ERR_OPERATOR_ID_IS_INVALID', message: 'Unable to create violation type. Invalid Operator' },
                { error: 'ERR_AMOUNT_IS_EMPTY', message: 'Unable to create violation type. Amount is required' },
                { error: 'ERR_PARKING_GROUP_IS_INVALID', message: 'Unable to create violation type. Invalid Parking Group' },
                { error: 'ERR_STATUS_IS_INVALID', message: 'Unable to create violation type. Invalid Status' },
                { error: 'ERR_CREATING_VIOLATION', message: 'Unable to create violation type. Something went wrong' }
            ]
        }
    }


    React.useEffect(() => {
        Promise.all([
            fetchParkingGroups(uxpContext),
            fetchAllParkingSites(uxpContext),
            fetchParkingOperator(uxpContext),
            // fetchP
        ]).then((result) => {
            const [groups, sites, operator] = result;
            setParkingGroups(groups);
            setParkingSites(sites);
            setParkingOperator(operator);

            setIsLoading(false);

        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
        })
    }, [])


    // For select field of parking group
    const mapParkingGroupNameWithParkingSiteName = React.useMemo(() => {
        if (!parkingGroups || !parkingSites) return [];

        return parkingGroups.map((group) => {
            let site = parkingSites.find(
                (site) => site[`${site?.type}.id`] === group['ParkingGroup.refParkingSite'] && group['ParkingGroup.category'] === site?.type
            )

            return {
                label: `${site?.[`${site?.type}.name`] || 'N/A'} - ${group?.['ParkingGroup.name']}`,
                value: group?.['ParkingGroup.id']
            }
        })

    }, [parkingGroups, parkingSites])


    React.useEffect(() => {
        if (formData.operatorId) {
            getParkingGroupsForOperator(formData.operatorId)
        }
    }, [formData])

    React.useEffect(() => {
    }, [parkingGroups, groups, parkingOperator])

    async function getParkingGroupsForOperator(operator: string) {
        uxpContext.executeAction("ParkingOperator", "groupsForOperator", { id: operator }, { json: true })
            .then(res => {
                let { valid, data } = handleSuccessResponse(res, 103201)
                if (valid) {
                    setGroups(data.flatMap((d: any) => d["ParkingGroup.id"]))
                }
            })
            .catch(e => {
            })
    }

    async function handleSubmit(data: any) {
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction("ViolationTypes", "violationsCreate", { ...data }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `Violation type updated`)

                        history.push("/violation-types")
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
        history.push("/violation-types")
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
            label: "Violation Title",
            name: "title",
            type: "string",
            validate: {
                required: true
            },
            value: getValue("title")
        },
        {
            label: "Description",
            name: "description",
            type: "string",
            value: getValue("description")
        },
        {
            label: "Amount",
            name: "amount",
            type: "number",
            validate: {
                required: true
            },
            value: getValue("amount")
        },
        {
            label: "Currency",
            name: "currency",
            type: "readonly",
            value: "SAR"
        },
        {
            label: "Status",
            name: "status",
            type: "select",
            options: statusOptions,
            value: getValue("status")
        },
        {
            label: "Parking Group",
            name: "parkingGroup",
            type: "select",
            options: mapParkingGroupNameWithParkingSiteName,
            value: getValue("parkingGroup")
            // renderColumn: 
        },
        {
            label: "Parking Operator",
            name: "operatorId",
            type: "select",
            options: parkingOperator,
            valueField: "_id",
            labelField: "companyName",
            validate: {
                required: true
            },
            value: getValue("operatorId")
            // renderColumn: 
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

const EditViolation: React.FunctionComponent<{ uxpContext: IContextProvider }> = (props) => {
    const { uxpContext } = props;

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [parkingGroups, setParkingGroups] = React.useState<IParkingGroup[]>(null);
    const [parkingSites, setParkingSites] = React.useState<IParkingSite[]>(null);
    const [parkingOperator, setParkingOperator] = React.useState<IParkingOperator[]>(null)
    const [groups, setGroups] = React.useState<string[]>([])
    const [error, setError] = React.useState(null)
    const [formData, setFormData] = React.useState<any>({})

    const toast = useToast();
    let history = useHistory()
    let { id: _id } = useParams<{ id: string }>()

    let detailsResponseCodes = {
        successCode: 103701,
        errorCodes: {
            103702: [
                { error: 'ERR_VIOLATION_NOT_FOUND', message: 'Unable to get Vehicle model details. No Vehicle model found.' },
                { error: 'ERR_FETCHING_DETAILS', message: 'Unable to get Vehicle model details. Something went wrong.' }
            ]
        }
    }

    let responseCodes = {
        successCode: 103701,
        successMessage: "",
        errorCodes: {
            103702: [
                { error: 'ERR_VIOLATION_NOT_FOUND', message: 'Unable to get Vehicle model details. No Vehicle model found.' },
                { error: 'ERR_FETCHING_DETAILS', message: 'Unable to get Vehicle model details. Something went wrong.' }
            ]
        }
    }


    React.useEffect(() => {
        Promise.all([
            fetchParkingGroups(uxpContext),
            fetchAllParkingSites(uxpContext),
            fetchParkingOperator(uxpContext),
            // fetchP
        ]).then((result) => {
            const [groups, sites, operator] = result;
            setParkingGroups(groups);
            setParkingSites(sites);
            setParkingOperator(operator);

            setIsLoading(false);

        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
        })
    }, [])

    React.useEffect(() => {
        getItemDetails()
    }, [_id])

    React.useEffect(() => {
        if (formData.operatorId) {
            getParkingGroupsForOperator(formData.operatorId)
        }
    }, [formData])

    React.useEffect(() => {
    }, [parkingGroups, groups, parkingOperator])



    // For select field of parking group
    const mapParkingGroupNameWithParkingSiteName = React.useMemo(() => {
        if (!parkingGroups || !parkingSites) return [];

        return parkingGroups?.map((group) => {
            let site = parkingSites.find(
                (site) => site[`${site?.type}.id`] === group['ParkingGroup.refParkingSite'] && group['ParkingGroup.category'] === site?.type
            )

            return {
                label: `${site?.[`${site?.type}.name`] || 'N/A'} - ${group?.['ParkingGroup.name']}`,
                value: group?.['ParkingGroup.id']
            }
        })

    }, [parkingGroups, parkingSites])

    function getItemDetails() {
        if (_id && _id.trim().length > 0) {
            setIsLoading(true)
            uxpContext.executeAction("ViolationTypes", "violationsDetails", { id: _id }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, detailsResponseCodes.successCode)
                    if (valid) {
                        if (data) {

                            if (data.operatorId) {
                                getParkingGroupsForOperator(data.operatorId)
                            }

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
                    console.log(`Unable to get voilation details. Exception: `, e);
                    let { valid, msg } = handleErrorResponse(e, detailsResponseCodes.errorCodes)
                    toast.error(msg)
                    setError(msg)
                    setIsLoading(false)
                })
        }
    }

    async function getParkingGroupsForOperator(operator: string) {
        uxpContext.executeAction("ParkingOperator", "groupsForOperator", { id: operator }, { json: true })
            .then(res => {
                let { valid, data } = handleSuccessResponse(res, 103201)
                if (valid) {
                    setGroups(data.flatMap((d: any) => d["ParkingGroup.id"]))
                }
            })
            .catch(e => {
            })
    }

    async function handleSubmit(data: any) {
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction("ViolationTypes", "violationsUpdate", { ...data, id: _id }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `Violation type updated`)

                        history.push("/violation-types")
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
        history.push("/violation-types")
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
            label: "Violation Title",
            name: "title",
            type: "string",
            validate: {
                required: true
            },
            value: getValue("title")
        },
        {
            label: "Description",
            name: "description",
            type: "string",
            value: getValue("description")
        },
        {
            label: "Amount",
            name: "amount",
            type: "number",
            validate: {
                required: true
            },
            value: getValue("amount")
        },
        {
            label: "Currency",
            name: "currency",
            type: "readonly",
            value: "SAR"
        },
        {
            label: "Status",
            name: "status",
            type: "select",
            options: statusOptions,
            value: getValue("status")
        },
        {
            label: "Parking Group",
            name: "parkingGroup",
            type: "select",
            options: mapParkingGroupNameWithParkingSiteName,
            value: getValue("parkingGroup")
            // renderColumn: 
        },
        {
            label: "Parking Operator",
            name: "operatorId",
            type: "select",
            options: parkingOperator,
            valueField: "_id",
            labelField: "companyName",
            validate: {
                required: true
            },
            value: getValue("operatorId")
            // renderColumn: 
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

export default ViolationTypes