import React from "react";
import { Button, DateTimePicker, FormField, Input, ItemListCard, Label, Loading, Modal, Select, Tooltip, useToast } from "uxp/components";
import { handleErrorResponse } from "../../utils";
import { IContextProvider } from "../../uxp";
import { Conditional } from "../common/ConditionalComponent";
import { ValidatableForm, ValidatableFormField, ValidatableFormRef } from "../common/ValidatableForm";
import { fetchAllDrivers, IDriver } from "../Drivers/Drivers";
import { fetchAllVehicles, fetchVehicleModels, IVehicle } from "../Drivers/VehicleDetailsModal";
import { IParkingGroup } from "../ParkingInformation/ParkingGroup";
import { IParkingSite } from "../ParkingInformation/ParkingSite";
import { IParkingSpot } from "../ParkingInformation/ParkingSpot";
import { fetchAllUsers, IUser } from "../Users/User";
import VehicleModels, { IVehicleModel } from "../VehiclesModel/VehiclesModel";
import SavedBookingInformationModal, { ISavedData } from "./SavedBookingInformationModal";

import holdIcon from '../../assets/images/hold.svg'
import filterIcon from '../../assets/images/filter.svg'
import { ParkingInformationContext } from "../ParkingInformation/ParkingInformation";

interface IBookingDetailsModalProps {
    uxpContext: IContextProvider,
    show: boolean,
    parkingSpot: IParkingSpot,
    parkingGroup: IParkingGroup,
    parkingSite: IParkingSite,
    onClose?: () => any,
    afterBookingASpot?: (bookedParkingSpot: IParkingSpot) => any,
}

export async function bookParkingSpot(parkingSpotId: string, data: any, uxpContext: IContextProvider): Promise<{ [key: string]: string }> {
    try {
        console.log(`Booking a parking spot`);

        const response = await uxpContext.executeAction('Parking', 'BookParkingSpot', { 'ParkingSpot.id': parkingSpotId, ...data, "issuerSystem": 'external_system' }, { json: true });

        return { ...response.data };
    } catch (err) { console.error(err); throw err; }
}

export async function readBooking(bookingId: string, uxpContext: IContextProvider): Promise<{ [key: string]: string }> {
    try {
        console.log(`Read booking a parking spot`);

        const response = await uxpContext.executeAction('Parking', 'ReadBooking', { 'id': bookingId }, { json: true });

        return { ...response.data };
    } catch (err) { console.error(err); throw err; }
}

export async function bookAnAvailableSpotOfSelectedParkingGroup(parkingGroupId: string, data: any, uxpContext: IContextProvider): Promise<{ [key: string]: string }> {
    try {
        console.log(`Booking an available spot of selected parking group`);

        const response = await uxpContext.executeAction('Parking', 'BookParkingSpot', { 'ParkingGroup.id': parkingGroupId, ...data, "issuerSystem": 'external_system' }, { json: true });

        return { ...response.data };
    } catch (err) { console.error(err); throw err; }
}

const BookingDetailsModal: React.VoidFunctionComponent<IBookingDetailsModalProps> = (props) => {

    const toast = useToast();

    const {
        parkingGroups,
        parkingSpots,
    } = React.useContext(ParkingInformationContext);

    const formRef = React.useRef<ValidatableFormRef>();
    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [isLoadingBooking, setIsLoadingBooking] = React.useState<boolean>(false);

    const [selectedDriverId, setSelectedDriverId] = React.useState<string>();
    const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>();
    const [bookingDuration, setBookingDuration] = React.useState<number>(0);

    const [vehicles, setVehicles] = React.useState<IVehicle[]>();
    const [vehicleModels, setVehicleModels] = React.useState<IVehicleModel[]>();
    const [drivers, setDrivers] = React.useState<IDriver[]>();
    const [users, setUsers] = React.useState<IUser[]>();

    const [showSavedBookingInformationModal, setShowSavedBookingInformationModal] = React.useState<boolean>(false);
    const [savedData, setSavedData] = React.useState<ISavedData>();

    const [filteredVehicleOptions, setFilteredVehicleOptions] = React.useState<{ label: string, value: string }[]>([]);
    const [filteredDriverOptions, setFilteredDriverOptions] = React.useState<{ label: string, value: string }[]>([]);

    let [userDetails, setUserDetails] = React.useState({
        userGroupName: null,
        userKey: null
    })


    React.useEffect(() => {
        // get current user detaisl 
        getCurrentUserDetails()
    }, [props.uxpContext])

    async function getCurrentUserDetails() {
        props.uxpContext.getUserDetails()
            .then((res: any) => {
                let userGroup = res?.userGroupName?.toLowerCase() || null
                let userKey = props.uxpContext.userKey
                setUserDetails({ userGroupName: userGroup, userKey })
            })

            .catch(e => {
                console.log("Error");
            })
    }

    React.useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetchAllVehicles(props.uxpContext),
            fetchAllDrivers(props.uxpContext),
            fetchVehicleModels(props.uxpContext),
            fetchAllUsers(props.uxpContext)
        ]).then((result) => {
            const [vehicles, drivers, vehicleModels, users] = result;
            console.log(result)
            setVehicles(vehicles)
            setDrivers(drivers)
            setVehicleModels(vehicleModels)
            setUsers(users)
        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
        }).finally(() => {
            setIsLoading(false);
        });
    }, [])

    React.useLayoutEffect(() => {
        clearAllFields();
    }, [props.show])

    const handleCancelButtonClick = () => {
        props.onClose();
    }

    const handleBookParkingSpotOrGroup = async () => {
        if (Object.keys(formRef.current?.validateFields(true)).length > 0) return;

        setIsLoadingBooking(true);

        const vehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
        const driver = driverMappedUsers?.find(driver => driver.id === selectedDriverId);

        const bookingData = {
            "driverId": selectedDriverId,
            "Vehicle.vehiclePlateIdentifier": vehicle?.["Vehicle.vehiclePlateIdentifier"],
            ...props.parkingSite?.type === 'OnStreetParking' && !props.parkingGroup?.smartBillingCapable ? { bookingDuration } : {},
            ...props.parkingSite?.type === 'OnStreetParking' && !props.parkingGroup?.smartBillingCapable ? { "checkinTimestamp": checkInTime } : {},
        };

        try {
            const bookedInformation = !!props.parkingSpot ?
                await bookParkingSpot(props.parkingSpot?.["ParkingSpot.id"], bookingData, props.uxpContext) :
                await bookAnAvailableSpotOfSelectedParkingGroup(props.parkingGroup?.["ParkingGroup.id"], bookingData, props.uxpContext)



            const bookingInformation = await readBooking(bookedInformation['Booking.id'], props.uxpContext);
            const parkingGroup = parkingGroups.find((group) => group['ParkingGroup.id'] === bookingInformation['Booking.parkingGroupId'])
            const parkingSpot = parkingSpots.find((spot) => spot['ParkingSpot.id'] === bookingInformation['Booking.parkingSpotId'])

            props.afterBookingASpot && props.afterBookingASpot(parkingSpot);

            setSavedData({
                parkingSite: props.parkingSite,
                parkingGroup: parkingGroup,
                parkingSpot: parkingSpot,
                driverName: driver.FullName,
                vehiclePlateIdentifier: vehicle?.["Vehicle.vehiclePlateIdentifier"],
                checkInTime: checkInTime.toISOString(),
                bookingId: bookedInformation['Booking.id'],
                amount: bookingInformation?.["Booking.amount"],
                currency: bookingInformation?.["Booking.currency"],
            });

            setShowSavedBookingInformationModal(true)

            props.onClose();

        } catch (error) {
            const r = handleErrorResponse(error, {
                100702: [
                    { error: 'ERR_ISSUER_SYSTEM_IS_EMPTY', message: 'Error... Issuer system is empty' },
                    { error: 'ERR_ISSUER_SYSTEM_IS_INVALID', message: 'Error... Issuer system is invalid' },
                    { error: 'ERR_ONLY_ONE_OF_DRIVER_OR_DEVICE_ID_REQUIRED', message: 'Error... One of device id is required' },
                    { error: 'ERR_DRIVER_IS_INVALID', message: 'Error... Driver id is invalid' },
                    { error: 'ERR_ONE_OF_DRIVER_OR_DEVICE_ID_REQUIRED', message: 'Error... One of driver or device id required' },
                    { error: 'ERR_ONLY_ONE_OF_PARKING_GROUP_OR_SPOT_ID_REQUIRED', message: 'Error... Only one of parking group or spot id is required' },
                    { error: 'ERR_PARKING_SPOT_IS_INVALID', message: 'Error... Parking spot is empty' },
                    { error: 'ERR_ONE_OF_PARKING_GROUP_OR_SPOT_ID_REQUIRED', message: 'Error...  One of parking group or spot id is required' },
                    { error: 'ERR_PARKING_GROUP_IS_INVALID', message: 'Error... Parking group is invalid' },
                    { error: 'ERR_VEHICLE_PLATE_IDENTIFIER_IS_EMPTY', message: 'Error... Vehicle plate no is invalid' },
                    { error: 'ERR_BOOKING_DURATION_IS_EMPTY', message: 'Error... Booking duration is empty' },
                    { error: 'ERR_VEHICLE_PLATE_IDENTIFIER_IS_INVALID', message: 'Error... Vehicle plate identifier is invalid' },
                    { error: 'ERR_VEHICLE_MODEL_IS_INVALID', message: 'Error... vehicle model is invalid' },
                    { error: 'ERR_VEHICLE_DIMENSIONS_NOT_SATISFIED', message: 'Error... Vehicle dimensions not satisfied' },
                    { error: 'ERR_VEHICLE_TYPE_NOT_SATISFIED', message: 'Error... Vehicle type has not been satisfied' },
                    { error: 'ERR_BOOKING_DURATION_IS_INVALID', message: 'Error... Booking duration is invalid' },
                    { error: 'ERR_PARKING_SPOT_IS_NOT_FREE', message: 'Error... Parking spot is not free' },
                    { error: 'ERR_BOOKING_ID_IS_INVALID', message: 'Error... Booking ID is invalid' },
                    { error: 'ERR_NO_AVAILABLE_SPOTS', message: 'Error... No Available Spots' },
                    { error: 'ERR_FETCHING_DETAILS', message: 'Error while fetching details...' },
                    { error: 'ERR_VEHICLE_HAS_ACTIVE_BOOKING', message: 'Error... Vehicle has active booking' },
                    { error: 'ERR_CHECK_IN_TIMESTAMP_IN_PAST', message: 'Error... Checkin time is in the past' },
                    { error: 'ERR_MISSING_SPECIAL_PERMITS', message: 'Error... Missing special permits' },
                    { error: 'ERR_DRIVER_IS_BLACKLISTED', message: 'Error...Driver is Blacklisted' }
                ]
            })

            toast.error(r?.msg)
        }

        setIsLoadingBooking(false);

    }

    const setDriverId = () => {
        if (userDetails?.userGroupName?.toLowerCase() === 'driver' && drivers?.length > 0) {
            let driver = drivers?.find(item => item["Driver.userId"] == userDetails?.userKey);
            setSelectedDriverId(driver?.id || null);
            return;
        }else {
            setSelectedDriverId(null);
        }
    }

    const clearAllFields = () => {
        setDriverId();
        setSelectedVehicleId(null);
        setTimeout(() => formRef.current?.refresh(), 300);
    }

    interface IDriverMappedUser extends IDriver, IUser { };
    interface IVehicleMappedModels extends IVehicle, IVehicleModel { };

    const driverMappedUsers = React.useMemo<IDriverMappedUser[]>(() => {
        if (!drivers || !users) return null;

        if (userDetails.userGroupName && userDetails.userGroupName == "driver") {
            let driver = drivers?.find((d: any) => (d["Driver.userId"] == userDetails.userKey))
            let user = users?.find((user) => user.UserKey == userDetails.userKey)
            return [{ ...user, ...driver }];
        }
        else {
            return drivers?.map((driver) => {
                const user = users?.find((user) => user.UserKey == driver["Driver.userId"])
                return { ...user, ...driver };
            })
        }

    }, [drivers, users])

    const vehicleMappedModels = React.useMemo<IVehicleMappedModels[]>(() => {
        if (!vehicles || !vehicleModels) return null;

        return vehicles?.map((vehicle) => {
            const vehicleModel = vehicleModels?.find((model) => model.id == vehicle["Vehicle.refVehicleModel"])
            return { ...vehicleModel, ...vehicle };
        })
    }, [vehicles, vehicleModels])

    React.useEffect(() => {
      setDriverId()
    }, [userDetails, drivers])

    React.useEffect(() => {
        if (!driverMappedUsers) return;

        if (!selectedVehicleId) {
            setFilteredDriverOptions(
                driverMappedUsers.map((driver) => ({ label: driver.FullName, value: driver.id }))
            )
        } else {
            const selectedVehicle = vehicles.find((vehicle) => vehicle.id == selectedVehicleId);

            setFilteredDriverOptions(
                driverMappedUsers.filter((driver) => selectedVehicle?.driverIds?.includes(driver.id)).map((driver) => ({ label: driver.FullName, value: driver.id }))
            )
        }

    }, [selectedVehicleId, driverMappedUsers]);

    React.useEffect(() => {
        if (!vehicleMappedModels) return;

        const mapVehicleToOption = (v: IVehicleMappedModels) => (
            {
                label: `${v["Vehicle.vehiclePlateIdentifier"]} : ${v.modelName} - ${v.brandName?.toUpperCase()} : ${v["Vehicle.vehicleType"]}`,
                value: v.id
            }
        )

        if (userDetails?.userGroupName?.toLowerCase() === 'driver') {
            let driver = drivers?.find(item => item["Driver.userId"] == userDetails?.userKey);

            setFilteredVehicleOptions(
                vehicleMappedModels.filter((vehicle) => vehicle.driverIds?.includes(driver?.id))?.map(mapVehicleToOption)
            )

            return;
        }

        if (!selectedDriverId) {
            setFilteredVehicleOptions(
                vehicleMappedModels.map(mapVehicleToOption)
            );
        } else {
            setFilteredVehicleOptions(
                vehicleMappedModels.filter((vehicle) => vehicle.driverIds?.includes(selectedDriverId))?.map(mapVehicleToOption)
            )
        }

    }, [selectedDriverId, vehicleMappedModels]);

    const [checkInTime, setCheckInTime] = React.useState<Date>();

    React.useLayoutEffect(() => {
        setCheckInTime(new Date())
    }, [props.show])

    const rateLabel = React.useMemo<string>(() => `${props.parkingGroup?.chargeUnitPrice}  SAR for ${props.parkingGroup?.chargeGranularity} minutes`, [props.parkingGroup])

    return (
        <>
            <SavedBookingInformationModal
                show={showSavedBookingInformationModal}
                savedData={savedData}
                onClose={() => setShowSavedBookingInformationModal(false)}
            />


            <Modal
                className="booking-details-modal"
                show={props.show}
                title={`Book A Parking Spot - ${props.parkingSite?.[`${props.parkingSite?.type}.name`]} : ${props.parkingGroup?.["ParkingGroup.name"]}`}
                onClose={() => { handleCancelButtonClick() }}>
                {
                    isLoading ? (
                        <div className="loading-text">
                            <Loading />
                            <span style={{ marginTop: '20px' }}>Loading informations </span>
                        </div>
                    ) : (
                        <>

                            <div className="section">

                                <ValidatableForm
                                    validateSchema={{
                                        driver: { fieldName: 'driver', label: 'Driver', validatorCollection: ['isRequired'] },
                                        vehicle: { fieldName: 'vehicle', label: 'Vehicle', validatorCollection: ['isRequired'] },
                                        ...
                                        props.parkingSite?.type === 'OnStreetParking' && !props.parkingGroup.smartBillingCapable ?
                                            { bookingDuration: { fieldName: 'bookingDuration', label: 'Booking Duration', validatorCollection: ['isRequired'] } } : {}
                                    }}
                                    ref={formRef}>


                                    <div className="form-field-group">
                                        <Conditional visible={!!props.parkingSpot}>
                                            <FormField className="form-field">
                                                <Label>Parking Spot</Label>
                                                <Input
                                                    placeholder="Parking Spot Name"
                                                    value={props.parkingSpot?.["ParkingSpot.name"]}
                                                    onChange={() => { }}
                                                />
                                            </FormField>
                                        </Conditional>

                                        <FormField className="form-field">
                                            <Label>Parking Group</Label>
                                            <Input
                                                placeholder="Parking Group Name"
                                                value={props.parkingGroup?.["ParkingGroup.name"]}
                                                onChange={() => { }}
                                            />
                                        </FormField>

                                        <FormField className="form-field">
                                            <Label>Parking Site</Label>
                                            <Input
                                                placeholder="Parking Site Name"
                                                value={props.parkingSite?.[`${props.parkingSite?.type}.name`]}
                                                onChange={() => { }}
                                            />
                                        </FormField>
                                    </div>

                                    <div className="form-field-group">
                                        <FormField className="form-field">
                                            <Label>Rate</Label>
                                            <Input
                                                placeholder="Rate for parking"
                                                value={rateLabel}
                                                onChange={() => { }}
                                            />
                                        </FormField>

                                        <FormField className="form-field">
                                            <Label>Check In Time</Label>
                                            {
                                                props.parkingGroup?.["ParkingGroup.category"] === 'OnStreetParking' ?

                                                    <DateTimePicker
                                                        options={{minDate: new Date()}}
                                                        title={"Check in time"}
                                                        datetime={checkInTime}
                                                        onChange={(val: Date) => {
                                                                let now = new Date();
                                                                let diff = now.getTime() - val.getTime();
                                                                let minute = 1 * 60 * 1000;

                                                                if (diff >= minute) {
                                                                    return;
                                                                }

                                                                setCheckInTime(val);
                                                            }
                                                        }
                                                    />

                                                    :

                                                    <Input
                                                        placeholder="Check in time"
                                                        value={checkInTime.toLocaleDateString()}
                                                        onChange={() => { }}
                                                    />
                                            }

                                        </FormField>
                                    </div>

                                    <div className="form-field-group">

                                        <ValidatableFormField fieldName="driver" label="Driver Name" value={selectedDriverId}>
                                            {
                                                userDetails?.userGroupName?.toLowerCase() === 'driver' 
                                                ?
                                                <Label>
                                                    {
                                                        users?.find(
                                                            item => item?.UserKey == userDetails?.userKey
                                                        )?.FullName
                                                        ||
                                                        'N/A'
                                                    }
                                                </Label>
                                                :
                                                <Select
                                                    placeholder="Driver"
                                                    options={filteredDriverOptions}
                                                    onChange={(value) => setSelectedDriverId(value)}
                                                    selected={selectedDriverId}
                                                    isValid={!!selectedDriverId}
                                                />
                                            }
                                        </ValidatableFormField>

                                        <ValidatableFormField fieldName="vehicle" label="Vehicle" value={selectedVehicleId}>
                                            <Select
                                                placeholder="Vehicle"
                                                options={filteredVehicleOptions}
                                                onChange={(value) => setSelectedVehicleId(value)}
                                                selected={selectedVehicleId}
                                                isValid={!!selectedVehicleId}
                                            />
                                        </ValidatableFormField>

                                        <Conditional visible={props.parkingSite?.type === 'OnStreetParking' && !props.parkingGroup?.smartBillingCapable}>
                                            <ValidatableFormField fieldName="bookingDuration" label="Booking Duration" value={bookingDuration}>
                                                <Input
                                                    type="number"
                                                    placeholder="Booking Duration"
                                                    value={bookingDuration?.toString()}
                                                    onChange={(value) => setBookingDuration(value && parseInt(value))}
                                                    isValid={!!bookingDuration}
                                                    hasIndicator
                                                />
                                            </ValidatableFormField>
                                        </Conditional>
                                    </div>
                                </ValidatableForm>
                            </div>
                            <div className="section">
                                <div className="controls">
                                    <FormField className="form-field-controls" inline>
                                        <Button
                                            icon={holdIcon}
                                            className="button"
                                            title={!!props.parkingSpot ? "Book this parking spot" : "Book an available spot of this group"}
                                            loading={isLoadingBooking}
                                            loadingTitle="Saving..."
                                            onClick={() => handleBookParkingSpotOrGroup()} />
                                        <Button
                                            icon={filterIcon}
                                            className="button"
                                            title="Clear All Fields"
                                            onClick={clearAllFields} />
                                    </FormField>
                                </div>
                            </div>
                        </>
                    )
                }
            </Modal>
        </>
    )
}


export default BookingDetailsModal