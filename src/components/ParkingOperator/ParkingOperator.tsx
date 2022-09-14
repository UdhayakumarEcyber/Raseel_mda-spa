import * as React from 'react'
import { useHistory } from 'react-router-dom';
import { Loading, useToast } from 'uxp/components';
import { allAphabetsAndNumber, email } from '../../regex';
import { IContextProvider } from '../../uxp';
import { Conditional } from '../common/ConditionalComponent';
import CrudComponent from '../common/CrudComponent/CrudComponent';

interface IMPO { uxpContext: IContextProvider }
const ParkingOperator: React.FunctionComponent<IMPO> = (props) => {
    let toast = useToast();

    let history = useHistory()

    const [isUsersLoading, setIsUsersLoading] = React.useState<boolean>(true);
    const [users, setUsers] = React.useState<[]>(null);

    React.useEffect(() => {
        props.uxpContext.executeAction('User', 'getUsers', {}, { json: true }).then((users) => {
            setUsers(users);
        }).catch((err) => {
            toast.error('Something went wrong while fetching the users....');
        }).finally(() => {
            setIsUsersLoading(false);
        });
    }, []);


    const mapActionData = React.useCallback((item) => {
        if (!users) return;

        let administrator = users?.find((user) => user['UserKey'] === item['refAdministrator']);
        let moderator = users?.find((user) => user['UserKey'] === item['refModerator']);

        item = {
            ...item,
            'refAdministratorName': administrator?.['FullName'] ?? 'Not Assigned',
            'refModeratorName': moderator?.['FullName'] ?? 'Not Assigned'
        }

        return item;

    }, [users]);

    let memorizedRoles = React.useMemo(() => {
        return {
            list: ["canviewparkingoperator"],
            add: ["cancreateparkingoperator"],
            edit: ["canupdateparkingoperator"],
            delete: ["candeleteparkingoperator"],
        }
    }, [])

    return (
        <>
            <Conditional visible={isUsersLoading}>
                <div className="loading-text">
                    <Loading />
                    <span style={{ marginTop: '20px' }}>Loading users </span>
                </div>
            </Conditional>

            <Conditional visible={!isUsersLoading && !!users}>

                <div className="page-content">

                    <CrudComponent
                        entityName='Parking Operator'
                        roles={memorizedRoles}
                        uxpContext={props.uxpContext}
                        list={{
                            default: {
                                model: "ParkingOperator",
                                action: "operatorsAll",
                                mapActionData,
                                itemId: "_id",
                                responseCodes: {
                                    successCode: 103201,
                                    errorCodes: {
                                        103202: [
                                            { error: 'ERR_FETCHING_OPERATORS', message: 'Unable to get Operators. Something went wrong' }
                                        ]
                                    }
                                },
                                columns: [
                                    {
                                        name: "Company Name",
                                        valueField: "companyName",
                                        columnWidth: ''
                                    },
                                    {
                                        name: "Registration Number",
                                        valueField: "registrationNumber",
                                        columnWidth: ''
                                    },
                                    {
                                        name: "Mobile",
                                        valueField: "mobileNumber",
                                        columnWidth: ''
                                    },
                                    {
                                        name: "Contact Name",
                                        valueField: "contactName",
                                        columnWidth: ''
                                    },
                                    {
                                        name: "Email",
                                        valueField: "email",
                                        columnWidth: ''
                                    },
                                    {
                                        name: "Administrator",
                                        valueField: "refAdministratorName",
                                        columnWidth: ''
                                    },
                                    {
                                        name: "Moderator",
                                        valueField: "refModeratorName",
                                        columnWidth: ''
                                    }
                                ],
                                deleteItem: {
                                    model: "ParkingOperator",
                                    action: "operatorsRemove",
                                    responseCodes: {
                                        successCode: 103201,
                                        successMessage: "Operator deleted",
                                        errorCodes: {
                                            103202: [
                                                { error: 'ERR_OPERATOR_IN_USE', message: 'Unable to delete operator. Operator in use' },
                                                { error: 'ERR_REMOVING_OPERATOR', message: 'Unable to delete operator. Something went wrong' },
                                                { error: 'ERR_OPERATOR_NOT_FOUND', message: 'Unable to delete operator. No operator found' }
                                            ]
                                        }
                                    }
                                },
                                toolbar: {
                                    search: {
                                        show: true,
                                        searchableFields: [
                                        "contactName",
                                        "email",
                                        "companyName",
                                        "registrationNumber",
                                        "mobileNumber",
                                        "email",
                                        "refAdministratorName"
                                    ]
                                    },
                                    // buttons: {export: {show: true, columns: {'contactName': "Contact Name", 'email': 'Email Address'}}}
                                }
                            }
                        }}
                        add={{
                            default: {
                                model: "ParkingOperator",
                                action: "operatorsCreate",
                                responseCodes: {
                                    successCode: 103201,
                                    successMessage: "Operator created",
                                    errorCodes: {
                                        103202: [
                                            { error: 'ERR_CREATING_OPERATOR', message: 'Unable to create operator. Something went wrong' },
                                            { error: 'ERR_MODERATOR_IS_INVALID', message: 'Unable to create operator. Moderator is invalid' },
                                            { error: 'ERR_ADMINISTRATOR_IS_INVALID', message: 'Unable to create operator. Administrator is invalid' },
                                            { error: 'ERR_CONTACT_NAME_IS_EMPTY', message: 'Unable to create operator. Contact name is required' },
                                            { error: 'ERR_EMAIL_ALREADY_EXISTS', message: 'Unable to create operator. Email already exists' },
                                            { error: 'ERR_INVALID_EMAIL_ADDRESS', message: 'Unable to create operator. Email is invalid' },
                                            { error: 'ERR_EMAIL_ADDRESS_IS_EMPTY', message: 'Unable to create operator. Email is required' },
                                            { error: 'ERR_MOBILE_NUMBER_IS_EMPTY', message: 'Unable to create operator. Mobile number is required' },
                                            { error: 'ERR_REGISTRATION_NUMBER_ALREADY_EXISTS', message: 'Unable to create operator. Registration Number already exists' },
                                            { error: 'ERR_REGISTRATION_NUMBER_IS_EMPTY', message: 'Unable to create operator. Registration Number is required' },
                                            { error: 'ERR_COMPANY_NAME_IS_EMPTY', message: 'Unable to create operator. Company name is required' },
                                            { error: 'ERR_COMPANY_NAME_IS_EMPTY', message: 'Unable to create operator. Company name is required' },
                                        ]
                                    }
                                },
                                formStructure: [
                                    {
                                        name: "companyName",
                                        label: "Company Name",
                                        type: "string",
                                        validate: {
                                            required: true,
                                            regExp: allAphabetsAndNumber
                                        }
                                    },
                                    {
                                        name: "registrationNumber",
                                        label: "Registration Number",
                                        type: "number",
                                        validate: {
                                            required: true
                                        }
                                    },
                                    {
                                        name: "contactName",
                                        label: "Contact Name",
                                        type: "string",
                                        validate: {
                                            required: true
                                        }
                                    },
                                    {
                                        name: "mobileNumber",
                                        label: "Mobile Number",
                                        type: "number",
                                        validate: {
                                            required: true
                                        }
                                    },
                                    {
                                        name: "email",
                                        label: "Company Email",
                                        type: "string",
                                        validate: {
                                            required: true,
                                            regExp: email
                                        }
                                    },
                                    {
                                        name: "refAdministrator",
                                        label: "Administrator",
                                        type: "select",
                                        options: users?.filter((u: any) => (u.UserGroupID.toLowerCase() == 'po administrator')) || [],
                                        labelField: 'FullName',
                                        valueField: 'UserKey',
                                    },
                                    {
                                        name: "refModerator",
                                        label: "Parking Moderator",
                                        type: "select",
                                        options: users?.filter((u: any) => (u.UserGroupID.toLowerCase() == 'po moderator')) || [],
                                        labelField: 'FullName',
                                        valueField: 'UserKey',
                                    },
                                ],
                                afterSave: () => { history.push("/parking-operator") },
                                onCancel: () => { history.push("/parking-operator") }
                            }
                        }}
                        edit={{
                            default: {
                                getDetails: {
                                    model: "ParkingOperator",
                                    action: "operatorsDetails",
                                    responseCodes: {
                                        successCode: 103201,
                                        errorCodes: {
                                            103202: [
                                                { error: 'ERR_FETCHING_DETAILS', message: 'Unable to get operator details. Something went wrong' },
                                                { error: 'ERR_OPERATOR_NOT_FOUND', message: 'Unable to get operator details. No operator found' }
                                            ]
                                        }
                                    }
                                },
                                model: "ParkingOperator",
                                action: "operatorsUpdate",
                                responseCodes: {
                                    successCode: 103201,
                                    successMessage: "Operator updated",
                                    errorCodes: {
                                        103202: [
                                            { error: 'ERR_UPDATING_OPERATOR', message: 'Unable to update operator. Something went wrong' },
                                            { error: 'ERR_MODERATOR_IS_INVALID', message: 'Unable to update operator. Moderator is invalid' },
                                            { error: 'ERR_ADMINISTRATOR_IS_INVALID', message: 'Unable to update operator. Administrator is invalid' },
                                            { error: 'ERR_CONTACT_NAME_IS_EMPTY', message: 'Unable to update operator. Contact name is requied' },
                                            { error: 'ERR_EMAIL_ALREADY_EXISTS', message: 'Unable to update operator. Email already exists' },
                                            { error: 'ERR_INVALID_EMAIL_ADDRESS', message: 'Unable to update operator. Email is invalid' },
                                            { error: 'ERR_EMAIL_ADDRESS_IS_EMPTY', message: 'Unable to update operator. Email is required' },
                                            { error: 'ERR_MOBILE_NUMBER_IS_EMPTY', message: 'Unable to update operator. Mobile number is required' },
                                            { error: 'ERR_REGISTRATION_NUMBER_ALREADY_EXISTS', message: 'Unable to update operator. Registration number already exists' },
                                            { error: 'ERR_REGISTRATION_NUMBER_IS_EMPTY', message: 'Unable to update operator. Registration number is required' },
                                            { error: 'ERR_COMPANY_NAME_IS_EMPTY', message: 'Unable to update operator. Company name is required' },
                                            { error: 'ERR_OPERATOR_NOT_FOUND', message: 'Unable to update operator. Operator not found' },
                                        ]
                                    }
                                },
                                formStructure: [
                                    {
                                        name: "companyName",
                                        label: "Company Name",
                                        type: "string",
                                        validate: {
                                            required: true,
                                            regExp: allAphabetsAndNumber
                                        }
                                    },
                                    {
                                        name: "registrationNumber",
                                        label: "Registration Number",
                                        type: "number",
                                        validate: {
                                            required: true
                                        }
                                    },
                                    {
                                        name: "contactName",
                                        label: "Contact Name",
                                        type: "string",
                                        validate: {
                                            required: true
                                        }
                                    },
                                    {
                                        name: "mobileNumber",
                                        label: "Mobile Number",
                                        type: "number",
                                        validate: {
                                            required: true
                                        }
                                    },
                                    {
                                        name: "email",
                                        label: "Company Email",
                                        type: "string",
                                        validate: {
                                            required: true,
                                            regExp: email
                                        }
                                    },
                                    {
                                        name: "refAdministrator",
                                        label: "Administrator",
                                        type: "select",
                                        options: users?.filter((u: any) => (u.UserGroupID.toLowerCase() == 'po administrator')) || [],
                                        labelField: 'FullName',
                                        valueField: 'UserKey',
                                    },
                                    {
                                        name: "refModerator",
                                        label: "Parking Moderator",
                                        type: "select",
                                        options: users?.filter((u: any) => (u.UserGroupID.toLowerCase() == 'po moderator')) || [],
                                        labelField: 'FullName',
                                        valueField: 'UserKey',
                                    },
                                ],
                                afterSave: () => { history.push("/parking-operator") },
                                onCancel: () => { history.push("/parking-operator") }
                            }
                        }}

                    />
                </div>
            </Conditional>
        </>
    )
}

export default ParkingOperator