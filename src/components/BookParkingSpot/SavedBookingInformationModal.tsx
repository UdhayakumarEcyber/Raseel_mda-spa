import React from "react";
import { Button, FormField, Input, ItemListCard, Label, Loading, Modal, Select, Tooltip, useToast } from "uxp/components";
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

export interface ISavedData {
    bookingId: string,
    parkingSpot: IParkingSpot,
    parkingGroup: IParkingGroup,
    parkingSite: IParkingSite,
    driverName: string,
    vehiclePlateIdentifier: string;
    checkInTime: string;
    amount: string;
    currency: string;
}

interface ISavedBookingInformationModalProps {
    show: boolean,
    savedData: ISavedData,
    onClose: () => any,
}


const SavedBookingInformationModal: React.VoidFunctionComponent<ISavedBookingInformationModalProps> = (props) => {

    // console.log('saved data', props.savedData)
    return (
        <Modal
            className="tabular-information-modal"
            show={props.show}
            title={`New Booking`}
            onClose={() => { props.onClose() }}>
            <div className="section">
                <h3 className="title">Parking spot has been successfully booked having following information</h3>
                <table id="information-table">
                    <tbody>
                        <tr>
                            <td>Booking ID : </td>
                            <td>{props.savedData?.bookingId}</td>
                        </tr>
                        <tr>
                            <td>Parking Spot : </td>
                            <td>{props.savedData?.parkingSpot?.["ParkingSpot.name"]}</td>
                        </tr>
                        <tr>
                            <td>Parking Group : </td>
                            <td>{props.savedData?.parkingGroup?.["ParkingGroup.name"]}</td>
                        </tr>
                        <tr>
                            <td>Parking Site : </td>
                            <td>{props.savedData?.parkingSite?.[`${props.savedData.parkingSite?.type}.name`]}</td>
                        </tr>
                        <tr>
                            <td>Rate : </td>
                            <td>{`${props.savedData?.parkingGroup?.chargeUnitPrice}  SAR for ${props.savedData?.parkingGroup?.chargeGranularity} minutes`}</td>
                        </tr>
                        <tr>
                            <td>Check In Time : </td>
                            <td>{props.savedData?.checkInTime}</td>
                        </tr>
                        <tr>
                            <td>Driver : </td>
                            <td>{props.savedData?.driverName}</td>
                        </tr>
                        <tr>
                            <td>Vehicle : </td>
                            <td>{props.savedData?.vehiclePlateIdentifier}</td>
                        </tr>
                        <Conditional visible={!!props.savedData?.amount}>
                            <tr style={{ fontSize: '13px', fontWeight: '600' }}>
                                <td>Charge : </td>
                                <td>{props.savedData?.currency} {props.savedData?.amount}</td>
                            </tr>
                        </Conditional>

                    </tbody>
                </table>
            </div>
        </Modal>
    )
}

export default SavedBookingInformationModal