import * as React from 'react'
import { useHistory } from 'react-router-dom';
import { Button, DataTable, FormField, IconButton, Input, Loading, useToast } from 'uxp/components';
import { IContextProvider } from '../../uxp';
import BreadCrumb from '../common/BreadCrumb';
import { Conditional } from '../common/ConditionalComponent';
import CrudComponent from '../common/CrudComponent/CrudComponent';
import { ListComponent } from '../common/CrudComponent/ListView';
import { fetchAllUsers, IUser } from '../Users/User';
import VehicleDetailsModal from './VehicleDetailsModal';

interface IDriversProps { uxpContext: IContextProvider }

export interface IDriver {
    'id': string;
    'Driver.userId': string;
    'Driver.vehicleIds': string[];
    'Driver.specialPermits': string[];
}

export async function fetchAllDrivers(uxpContext: IContextProvider): Promise<IDriver[]> {
    try {
        console.log('Fetching all drivers');

        const result = await uxpContext.executeAction('Driver', 'driverAll', {}, { json: true });

        return result.data as IDriver[];

    } catch (err) { console.error(err); throw err; }
}

export async function findDriverById(id: string, uxpContext: IContextProvider): Promise<IDriver> {
    try {
        console.log('Fetching all drivers');

        const result = await uxpContext.executeAction('Driver', 'driverDetails', { id }, { json: true });

        return { id, ...result.data } as IDriver;

    } catch (err) { console.error(err); throw err; }
}

const Drivers: React.FunctionComponent<IDriversProps> = ({ uxpContext }) => {

    let toast = useToast();
    let history = useHistory();

    const [users, setUsers] = React.useState<IUser[]>([]);
    const [isUsersLoading, setIsUsersLoading] = React.useState<boolean>(false);
    const [editingDriver, setEditingDriver] = React.useState<IDriver>();
    const [showVehicleDetailsModal, setShowVehicleDetailsModal] = React.useState<boolean>(false);

    let [userDetails, setUserDetails] = React.useState({
        userGroupName: null,
        userKey: null
    })

    React.useEffect(() => {
        fetchAllUsers(uxpContext).then((users) => {
            setUsers(users);
            setIsUsersLoading(false);
        }).catch((err) => {
            toast.error('Something went wrong while fetching the users....');
        }).finally(() => {
            setIsUsersLoading(false);
        });
    }, []);

    React.useEffect(() => {
        // get current user detaisl 
        getCurrentUserDetails()
    }, [uxpContext])

    async function getCurrentUserDetails() {
        uxpContext.getUserDetails()
            .then((res: any) => {

                let userGroup = res?.userGroupName?.toLowerCase() || null
                let userKey = uxpContext.userKey
                setUserDetails({ userGroupName: userGroup, userKey })
            })

            .catch(e => {
                console.log("Error");
            })
    }

    let memorizedRoles = React.useMemo(() => {
        return {
            add: ["cancreatedriver"],
            edit: ["canupdatedriver", "canassignpecialpermit"],
            delete: ["candeletedriver"],
            list: ["canviewdriver"]
        }
    }, [])

    return (<>
        <Conditional visible={isUsersLoading}>
            <div className="loading-text">
                <Loading />
                <div style={{ marginTop: '20px' }}>Loading drivers</div>
            </div>
        </Conditional>


        <Conditional visible={!isUsersLoading && users.length > 0}>

            <div className="page-content">

                <CrudComponent
                    roles={memorizedRoles}
                    uxpContext={uxpContext}
                    entityName={'Drivers'}
                    list={{
                        default: {
                            model: "Driver",
                            action: "driverAll",
                            itemId: "id",
                            filterData: (data) => {

                                if (userDetails.userGroupName == "driver") {
                                    return data.filter(d => (d['Driver.userId'] == userDetails.userKey))
                                }

                                return data
                            },
                            actions: {
                                edit: false,
                                delete: false,
                                view: false
                            },
                            responseCodes: {
                                successCode: 101301,
                                errorCodes: {
                                    101302: [
                                        { error: 'ERR_FETCHING_DRIVERS', message: 'Unable to get drivers. Something went wrong' }
                                    ]
                                }
                            },
                            mapActionData: (driver: IDriver) => {
                                const user = users?.find((user) => driver['Driver.userId'] == user.UserKey);
                                console.log(driver['Driver.userId']);

                                return {
                                    firstName: user?.FirstName || 'N/A',
                                    lastName: user?.LastName || 'N/A',
                                    mobileNo: user?.Phone || 'N/A',
                                    contactName: user?.FullName || 'N/A',
                                    email: user?.Email || 'N/A',
                                    ...driver
                                }
                            },
                            columns: [
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
                                    name: "Mobile #",
                                    valueField: "mobileNo",
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
                                    name: "Vehicles",
                                    columnWidth: '',
                                    disable: userDetails?.userGroupName?.toLowerCase() !== "po moderator" && userDetails?.userGroupName?.toLowerCase() !== "driver",
                                    renderColumn: (driver) => {

                                        let canUpdateVehicles = false
                                        if (userDetails.userGroupName && userDetails.userGroupName.trim().length > 0) {
                                            if (userDetails.userGroupName == "po moderator" || userDetails.userGroupName == "driver") {
                                                canUpdateVehicles = true
                                            }
                                        }

                                        if (!canUpdateVehicles) return null
                                        return <Button className="button" title="Manage Vehicles" onClick={() => {
                                            setEditingDriver(driver);
                                            setShowVehicleDetailsModal(true);
                                        }} />
                                    }
                                },
                            ],
                            toolbar: {
                                buttons: {
                                    add: {
                                        show: false
                                    },
                                    export: { // export to excel
                                        show: true, 
                                        columns: {
                                            "firstName": "First Name",
                                            "lastName": "Last Name",
                                            "mobileNo": "Mobile",
                                            "contactName": "Contact Name",
                                            "email": "Email"
                                          }
                                    },
                                },
                                search: {
                                    show: userDetails.userGroupName != "driver",
                                    searchableFields: ["firstName", "lastName", "mobileNo", "contactName", "email"]
                                }
                            }

                        }
                    }}
                    add={{}}
                    edit={{}}

                />
            </div>

        </Conditional>
        <VehicleDetailsModal
            editingDriver={editingDriver}
            uxpContext={uxpContext}
            show={showVehicleDetailsModal}
            onClose={() => setShowVehicleDetailsModal(false)}
        />
    </>
    )
}

export default Drivers
