import * as React from 'react'
import { useHistory } from 'react-router-dom';
import { IOption, Loading } from 'uxp/components';
import { IContextProvider } from '../../uxp';
import { Conditional } from '../common/ConditionalComponent';
import { IFormData } from '../common/CrudComponent/components/DynamicFormComponent';
import CrudComponent from '../common/CrudComponent/CrudComponent';
import { fetchParkingGroupOptions } from '../Devices/Properties';
import { fetchAllVehicles, IVehicle } from '../Drivers/VehicleDetailsModal';
import { fetchAllUsers, IUser } from '../Users/User';
import { fetchViolationTypes, IViolationTypes } from './ViolationTypes';

interface IPenalties { uxpContext: IContextProvider }

const state = [
    { label: "Registered but not Paid", value: 'registered but not paid' },
    { label: "Registered but Cleared", value: 'registered but cleared' },
    { label: "Registered and Paid", value: 'registered and paid' },
    { label: 'Cancel', value: 'cancelled' }
]

const clearanceReasonType = [
    { label: 'Verified Sofware Error', value: 'VerifiedSofwareError' },
    { label: 'Verified Hardware Error', value: 'VerifiedHardwareError' },
    { label: 'Verified Human Error', value: 'VerifiedHumanError' },
    { label: 'First Time Penalty', value: 'FirstTimePenalty' },
    { label: 'Test', value: 'Test' },
    { label: 'Other', value: 'Other' },
]

const Penalties: React.FunctionComponent<IPenalties> = (props) => {

    const { uxpContext } = props;

    let history = useHistory()

    const [users, setUsers] = React.useState<IUser[]>([]);
    const [violationTypes, setViolationType] = React.useState<IViolationTypes[]>(null)
    const [vehicles, setVehicles] = React.useState<IVehicle[]>(null)
    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [parkingGroupOptions, setParkingGroupOptions] = React.useState<IOption[]>(null);

    const mapActionData = React.useCallback((item) => {
        if (!parkingGroupOptions) return item;
        const group = parkingGroupOptions.find(g => g["value"] === item["ParkingGroup.id"])

        if (group) {
            item = {
                ...item,
                "ParkingGroup.id": group["value"]
            }
        }
        return item;

    }, [parkingGroupOptions])

    const getParkingGroupOptions = async () => {
        const Options = await fetchParkingGroupOptions(uxpContext);
        setParkingGroupOptions([...Options]);
    }

    React.useEffect(() => {
        const fetch = async () => {
            try {

                const users: IUser[] = await fetchAllUsers(uxpContext);
                setUsers(users)
                const violationTypes = await fetchViolationTypes(uxpContext);
                setViolationType(violationTypes);
                const vehicles = await fetchAllVehicles(uxpContext);
                setVehicles(vehicles);
                await getParkingGroupOptions();
                setIsLoading(false)
            } catch (err) {
                console.log(err);
            }
        }
        fetch()
    }, [])

    const onChange = (prevFormData: IFormData, newFormData: IFormData): IFormData => {
        if (prevFormData?.["violationType"] !== newFormData?.["violationType"]) {
            let violationType = violationTypes.find(v => v["title"] === newFormData?.["violationType"]);
            if (violationType) {
                newFormData["amount"] = violationType?.amount;
            }
        }
        return newFormData;
    }

    let memorizedRoles = React.useMemo(() => {
        return {

            list: ["canviewpenalty"],
            add: ["cancreatepenalty"],
            edit: ["canupdatepenalty"],
            delete: [],

        }
    }, [])

    return <>
        <Conditional visible={isLoading}>
            <div className="loading-text">
                <Loading />
                <span style={{ marginTop: '20px' }}>Loading Penalties</span>
            </div>
        </Conditional>

        <Conditional visible={!isLoading && !!parkingGroupOptions}>
            <div className="page-content">
                <CrudComponent
                    entityName='Penalties'
                    uxpContext={uxpContext}
                    roles={memorizedRoles}
                    list={{
                        default: {
                            model: "Penalty",
                            action: "penaltiesAll",
                            mapActionData,
                            actions: {
                                delete: false,
                            },
                            labels: {
                                add: "Register",
                                edit: "Clear"
                            },
                            itemId: "id",
                            responseCodes: {
                                successCode: 102101,
                                errorCodes: {
                                    102102: [
                                        { error: 'ERR_FETCHING_VIOLATIONS', message: 'Unable to get Penalties. Something went wrong' }
                                    ]
                                }
                            },

                            // "id"
                            // "Vehicle.vehiclePlateIdentifier"
                            // "moderatorId"
                            // "ParkingGroup.id"
                            // "violationType"
                            // "amount"
                            // "violationTimestamp"
                            // "attachment"
                            // "clearanceAttachment"
                            // "description"
                            // "clearanceDescription"
                            // "clearanceReasonType"
                            // "clearedById"
                            // "draftStatus"
                            // "state"
                            // "refPayment"
                            columns: [
                                {
                                    name: "vehicle Plate No",
                                    valueField: "Vehicle.vehiclePlateIdentifier",
                                    columnWidth: ''
                                },
                                {
                                    name: "Moderator",
                                    valueField: "moderatorId",
                                    columnWidth: '',
                                    renderColumn: item => {
                                        return <div>
                                            {
                                            users?.find(
                                                user => user?.UserKey == item?.moderatorId
                                            )?.DisplayName
                                            ||
                                            item.moderatorId
                                        }
                                        </div>
                                    }
                                },
                                {
                                    name: "Parking Group",
                                    valueField: "ParkingGroup.id",
                                    columnWidth: ''
                                },
                                {
                                    name: "Violation type",
                                    valueField: "violationType",
                                    columnWidth: ''
                                },
                                {
                                    name: "Amount",
                                    valueField: "amount",
                                    columnWidth: ''
                                },
                                {
                                    name: "Date Time",
                                    valueField: "violationTimestamp",
                                    columnWidth: ''
                                },
                                {
                                    name: "Description",
                                    valueField: "description",
                                    columnWidth: ''
                                },
                                {
                                    name: "Attachment",
                                    valueField: "attachment",
                                    columnWidth: '',
                                    renderColumn: (item) => {
                                        if (item.attachment && item.attachment.trim().length > 0) {
                                            return <a href={item.attachment} target="_blank" >View</a>
                                        }
                                        return null
                                    }
                                },
                                {
                                    name: "Clearance Description",
                                    valueField: "clearanceDescription",
                                    columnWidth: ''
                                },
                                {
                                    name: "Clearance Attachment",
                                    valueField: "clearanceAttachment",
                                    columnWidth: '',
                                    renderColumn: (item) => {
                                        if (item.clearanceAttachment && item.clearanceAttachment.trim().length > 0) {
                                            return <a href={item.clearanceAttachment} target="_blank" >View</a>
                                        }
                                        return null
                                    }
                                },
                                {
                                    name: "Clearance Reason Type",
                                    valueField: "clearanceReasonType",
                                    columnWidth: ''
                                },
                                {
                                    name: "Draft Status",
                                    valueField: "draftStatus",
                                    columnWidth: ''
                                },
                                {
                                    name: "State",
                                    valueField: "state",
                                    columnWidth: ''
                                }
                            ],
                            toolbar: {
                                show: true,
                                search: {
                                    show: true,
                                    searchableFields: [
                                        "Vehicle.vehiclePlateIdentifier",
                                        "violationType",
                                        "state",
                                        "moderatorId",
                                        "ParkingGroup.id",
                                        "amount",
                                        "violationTimestamp",
                                        "description",
                                        "clearanceDescription",
                                        "clearanceReasonType",
                                    ]
                                },
                                buttons: {
                                    export: {
                                        show: true,
                                        columns: {
                                            "Vehicle.vehiclePlateIdentifier": "vehicle Plate No",
                                            "moderatorId": "Moderator",
                                            "ParkingGroup.id": "Parking Group",
                                            "violationType": "Violation type",
                                            "amount": "Amount",
                                            "violationTimestamp": "Date Time",
                                            "description": "Description",
                                            "attachment": "Attachment",
                                            "clearanceDescription": "Clearance Description",
                                            "clearanceAttachment": "Clearance Attachment",
                                            "clearanceReasonType": "Clearance Reason Type",
                                            "state": "State",

                                        }
                                    }
                                }
                            }
                        }
                    }}
                    add={{
                        default: {
                            model: "Penalty",
                            action: "penaltiesCreate",
                            responseCodes: {
                                successCode: 102101,
                                successMessage: "Penalties created",
                                errorCodes: {
                                    102102: [
                                        { error: 'ERR_VEHICLE_PLATE_IDENTIFIER_IS_EMPTY', message: 'Unable to register Penalty. Vehicle Plate Identifier is required' },
                                        { error: 'ERR_MODERATOR_ID_IS_EMPTY', message: 'Unable to register Penalty. Moderator is required' },
                                        { error: 'ERR_MODERATOR_ID_IS_INVALID', message: 'Unable to register Penalty. Moderator ID is required' },
                                        { error: 'ERR_PARKING_GROUP_ID_IS_EMPTY', message: 'Unable to register Penalty. Parking Group is required' },
                                        { error: 'ERR_PARKING_GROUP_ID_IS_INVALID', message: 'Unable to register Penalty. Invalid Parking Group' },
                                        { error: 'ERR_VIOLATION_TYPE_IS_EMPTY', message: 'Unable to register Penalty. Violation type is required' },
                                        { error: 'ERR_VIOLATION_TYPE_IS_INVALID', message: 'Unable to register Penalty. Invalid Violation type' },
                                        { error: 'ERR_AMOUNT_IS_EMPTY', message: 'Unable to register Penalty. Amount is required' },
                                        { error: 'ERR_STATE_IS_EMPTY', message: 'Unable to register Penalty. State is required' },
                                        { error: 'ERR_STATE_IS_INVALID', message: 'Unable to register Penalty. Invalid state' },
                                        { error: 'ERR_ATTACHMENT_SIZE_LIMIT_EXCEED', message: 'Unable to register Penalty. Attchment size exceed limit' },
                                        { error: 'ERR_CREATING_PENALTY', message: 'Unable to register Penalty. Something went wrong' }
                                    ]
                                }
                            },
                            formStructure: [
                                {
                                    label: "Vehicle Plate Identifier",
                                    name: "Vehicle.vehiclePlateIdentifier",
                                    type: "select",
                                    options: vehicles,
                                    valueField: "Vehicle.vehiclePlateIdentifier",
                                    labelField: "Vehicle.vehiclePlateIdentifier",
                                    disable: true,
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Moderator",
                                    name: "moderatorId",
                                    type: "readonly",
                                    displayValue: users?.find((u: any) => (u.UserKey == props.uxpContext.userKey))?.DisplayName || '-',
                                    value: users?.find((u: any) => (u.UserKey == props.uxpContext.userKey))?.UserKey || '',
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Parking Group",
                                    name: "ParkingGroup.id",
                                    type: "select",
                                    options: parkingGroupOptions,
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Violation Type",
                                    name: "violationType",
                                    type: "select",
                                    options: violationTypes,
                                    valueField: "title",
                                    labelField: "title",
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Amount",
                                    name: "amount",
                                    disable: true,
                                    type: "number",
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "State",
                                    name: "state",
                                    type: "select",
                                    options: state
                                },
                                {
                                    label: "Description",
                                    name: "description",
                                    type: "string"
                                },
                                {
                                    label: "Attachment",
                                    name: "attachment",
                                    type: "attachment",
                                    attachment: {
                                        uxpContext,
                                        buttonLabel: "Add Attachment"
                                    }
                                }
                            ],
                            onChange,
                            afterSave: () => { history.push("/manage-penalties") },
                            onCancel: () => { history.push("/manage-penalties") }
                        }
                    }}
                    edit={{
                        default: {
                            getDetails: {
                                model: "Penalty",
                                action: "penaltiesDetails",
                                responseCodes: {
                                    successCode: 102101,
                                    errorCodes: {
                                        102102: [
                                            { error: 'ERR_PARKING_ACCESS_NOT_FOUND', message: 'Unable to get parking access details. No parking access found.' },
                                            { error: 'ERR_FETCHING_DETAILS', message: 'Unable to get parking access details. Something went wrong.' }
                                        ]
                                    }
                                }
                            },
                            model: "Penalty",
                            action: "penaltiesUpdate",
                            responseCodes: {
                                successCode: 102101,
                                successMessage: "Penalties Cleared",
                                errorCodes: {
                                    102102: [
                                        { error: 'ERR_PENALTY_NOT_FOUND', message: 'Unable to Clear Penalty. No Penalty found.' },
                                        { error: 'ERR_VEHICLE_PLATE_IDENTIFIER_IS_EMPTY', message: 'Unable to clear Penalty. Vehicle Plate Identifier is required' },
                                        { error: 'ERR_MODERATOR_ID_IS_EMPTY', message: 'Unable to clear Penalty. Moderator is required' },
                                        { error: 'ERR_MODERATOR_ID_IS_INVALID', message: 'Unable to clear Penalty. Moderator ID is required' },
                                        { error: 'ERR_PARKING_GROUP_ID_IS_EMPTY', message: 'Unable to clear Penalty. Parking Group is required' },
                                        { error: 'ERR_PARKING_GROUP_ID_IS_INVALID', message: 'Unable to clear Penalty. Invalid Parking Group' },
                                        { error: 'ERR_VIOLATION_TYPE_IS_EMPTY', message: 'Unable to clear Penalty. Violation type is required' },
                                        { error: 'ERR_VIOLATION_TYPE_IS_INVALID', message: 'Unable to clear Penalty. Invalid Violation type' },
                                        { error: 'ERR_AMOUNT_IS_EMPTY', message: 'Unable to clear Penalty. Amount is required' },
                                        { error: 'ERR_ATTACHMENT_SIZE_LIMIT_EXCEED', message: 'Unable to clear Penalty. Attchment size exceed limit' },
                                        { error: 'ERR_CLEARANCE_REASON_TYPE_IS_INVALID', message: 'Unable to clear Penalty.Invalid Clearance Reason' },
                                        { error: 'ERR_CLEARED_BY_ID_IS_INVALID', message: 'Unable to clear Penalty. Invalid Clearance' },
                                        { error: 'ERR_STATE_IS_EMPTY', message: 'Unable to clear Penalty. State is required' },
                                        { error: 'ERR_STATE_IS_INVALID', message: 'Unable to clear Penalty. Invalid state' },
                                        { error: 'ERR_UPDATING_PENALTY', message: 'Unable to clear Penalty. Something went wrong' }
                                    ]
                                }
                            },
                            formStructure: [
                                {
                                    label: "Vehicle Plate Identifier",
                                    name: "Vehicle.vehiclePlateIdentifier",
                                    type: "select",
                                    options: vehicles,
                                    valueField: "Vehicle.vehiclePlateIdentifier",
                                    labelField: "Vehicle.vehiclePlateIdentifier",
                                    disable: true,
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Parking Group",
                                    name: "ParkingGroup.id",
                                    type: "select",
                                    options: parkingGroupOptions,
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Violation Type",
                                    name: "violationType",
                                    type: "select",
                                    options: violationTypes,
                                    valueField: "title",
                                    labelField: "title",
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Amount",
                                    name: "amount",
                                    type: "number",
                                    disable: true,
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Clearance Description",
                                    name: "clearanceDescription",
                                    type: "string"
                                },
                                {
                                    label: "Clearance Reason",
                                    name: "clearanceReasonType",
                                    type: "select",
                                    options: clearanceReasonType
                                },
                                {
                                    label: "Clearance Attachment",
                                    name: "clearanceAttachment",
                                    type: "attachment",
                                    attachment: {
                                        uxpContext,
                                        buttonLabel: "Add Attachment"
                                    }
                                },
                                {
                                    label: "Cleared By",
                                    name: "clearedById",
                                    type: "readonly",
                                    displayValue: users?.find((u: any) => (u.UserKey == props.uxpContext.userKey))?.DisplayName || '-',
                                    value: users?.find((u: any) => (u.UserKey == props.uxpContext.userKey))?.UserKey || ''
                                },
                            ],
                            onChange,
                            afterSave: () => { history.push("/manage-penalties") },
                            onCancel: () => { history.push("/manage-penalties") }
                        }
                    }}

                />

            </div>
        </Conditional>
    </>
}

export default Penalties;