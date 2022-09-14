import React from "react";
import { Loading, Modal } from "uxp/components";
import { IContextProvider } from "../../uxp";
import { Conditional } from "../common/ConditionalComponent";
import { findParkingGroupById, IParkingGroup } from "../ParkingInformation/ParkingGroup";
import { findParkingSiteById, IParkingSite } from "../ParkingInformation/ParkingSite";
import { findParkingSpotById, IParkingSpot } from "../ParkingInformation/ParkingSpot";
import { findUserByUserKey, IUser } from "../Users/User";
import { ISupportTicket } from "./SupportTickets";

interface ISupportTicketInformationModalProps {
    show: boolean,
    ticket: ISupportTicket,
    onClose: () => any,
    uxpContext: IContextProvider
}

const SupportTicketInformationModal: React.VoidFunctionComponent<ISupportTicketInformationModalProps> = (props) => {

    const { ticket } = props;

    const [parkingSpot, setParkingSpot] = React.useState<IParkingSpot>();
    const [parkingGroup, setParkingGroup] = React.useState<IParkingGroup>();
    const [parkingSite, setParkingSite] = React.useState<IParkingSite>();

    const [createdByUser, setCreatedByUser] = React.useState<IUser>();
    const [updatedByUser, setUpdatedByUser] = React.useState<IUser>();

    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!ticket) return;

        console.log(ticket)

        Promise.allSettled([
            findParkingSpotById(ticket?.parkingSpotId, props.uxpContext).then(setParkingSpot),
            findParkingGroupById(ticket?.parkingGroupId, props.uxpContext).then(setParkingGroup),
            findParkingSiteById(ticket?.parkingSiteId, ticket?.category, props.uxpContext).then(setParkingSite),
            findUserByUserKey(ticket?.createdBy, props.uxpContext).then(setCreatedByUser),
            findUserByUserKey(ticket?.updatedBy, props.uxpContext).then(setUpdatedByUser)
        ]).catch((err) => {
            console.error(err)
        }).finally(() => {
            setIsLoading(false);
        });

    }, [ticket])

    const f = (str: any) => str || 'N/A'

    return (
        <>
            <Modal
                className="support-ticket-information-modal tabular-information-modal"
                show={props.show}
                title={`Support Ticket Information`}
                onClose={() => { props.onClose() }}>

                <Conditional visible={isLoading}>
                    <div className="loading-text">
                        <Loading />
                        <span style={{ marginTop: '20px' }}>Loading Support Ticket Information </span>
                    </div>
                </Conditional>

                <Conditional visible={!isLoading}>
                    <div className="section">
                        <table id="information-table">
                            <tbody>
                                <tr style={{ fontSize: '15px', fontWeight: '600' }}>
                                    <td>Status : </td>
                                    <td>{f(ticket?.status)}</td>
                                </tr>
                                <tr>
                                    <td>Booking ID : </td>
                                    <td>{f(ticket?.bookingId)}</td>
                                </tr>
                                <tr>
                                    <td>Parking Spot : </td>
                                    <td>{f(parkingSpot?.["ParkingSpot.name"])}</td>
                                </tr>
                                <tr>
                                    <td>Parking Group : </td>
                                    <td>{f(parkingGroup?.["ParkingGroup.name"])}</td>
                                </tr>
                                <tr>
                                    <td>Parking Site : </td>
                                    <td>{f(parkingSite?.[`${parkingSite?.type}.name`])}</td>
                                </tr>
                                <tr>
                                    <td>Created By : </td>
                                    <td>{f(createdByUser?.FullName)}</td>
                                </tr>
                                {/* 
                                <tr>
                                    <td>Created At : </td>
                                    <td>{f(ticket?.createdAt)}</td>
                                </tr> 
                                */}
                                <tr>
                                    <td>Updated By : </td>
                                    <td>{f(updatedByUser?.FullName)}</td>
                                </tr>
                                {/* <tr>
                                    <td>Updated At : </td>
                                    <td>{f(ticket?.createdAt)}</td>
                                </tr> */}
                                <tr style={{ fontSize: '13px', fontWeight: '600' }}>
                                    <td>Description : </td>
                                    <td>{f(ticket?.description)}</td>
                                </tr>
                                <tr style={{ fontSize: '13px', fontWeight: '600' }}>
                                    <td>Reason For Resolve/Reject : </td>
                                    <td>{f(ticket?.reason)}</td>
                                </tr>
                                <Conditional visible={!!ticket?.attachment}>
                                    <tr style={{ fontSize: '13px', fontWeight: '600' }}>
                                        <td colSpan={2}>
                                            <img src={ticket?.attachment}/>
                                        </td>
                                    </tr>
                                </Conditional>
                            </tbody>
                        </table>
                    </div>
                </Conditional>
            </Modal>
        </>
    )
}

export default SupportTicketInformationModal