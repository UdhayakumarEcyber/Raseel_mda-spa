import * as React from 'react'
import { useHistory, useParams } from 'react-router-dom';
import { Button, IOption, Loading, NotificationBlock, useToast } from 'uxp/components';
import { IFormFieldDefinition } from '../../../crud-component';
import { handleErrorResponse, handleSuccessResponse, hasRole } from '../../utils';
import { IContextProvider } from '../../uxp';
import { Conditional } from '../common/ConditionalComponent';
import CrudComponent from '../common/CrudComponent/CrudComponent';
import { fetchParkingGroups, IParkingGroup } from '../ParkingInformation/ParkingGroup';
import { ParkingSiteType } from '../ParkingInformation/ParkingSite';
import SupportTicketInformationModal from './SupportTicketInformationModal';

import checkCircleIcon from '../../assets/images/check-circle.svg'
import tickCrossIcon from '../../assets/images/close-circle-outline.svg'
import ticketIcon from '../../assets/images/ticket.svg'
import InputPopup from '../common/PopupAlert/InputPopup';
import ConfirmPopup from '../common/PopupAlert/ConfirmPopup';

interface ISupportTicketsProps { uxpContext: IContextProvider }

export interface ISupportTicket {
    _id: string;
    status: string;
    bookingId: string;
    poId: string;
    category: ParkingSiteType;
    parkingSpotId: string;
    parkingGroupId: string;
    parkingSiteId: string;
    createdBy: string;
    vehiclePlateIdentifier: string;
    createdAt: Date;
    updatedBy?: any;
    updatedAt?: any;
    description: string;
    reason?: any;
    attachment: string;
    accepted: boolean;
}

export async function fetchBookings(uxpContext: IContextProvider): Promise<any[]> {
    try {
        console.log('Fetching Bookings...');

        const response = await uxpContext.executeAction('SupportTicket', 'GetLatestBookings', {}, { json: true });

        return response?.data as any[];

    } catch (err) { console.error(err); throw err; }
}

export async function acceptTicket(ticketId: string, uxpContext: IContextProvider): Promise<boolean> {
    try {
        console.log('Accepting Ticket...');

        await uxpContext.executeAction('SupportTicket', 'AcceptTicket', { ticketId }, { json: true });

        return true;
    } catch (err) { console.error(err); throw err; }
}

export async function resolveTicket(ticketId: string, reason: string, uxpContext: IContextProvider): Promise<boolean> {
    try {
        console.log('Resolving Ticket...');

        await uxpContext.executeAction('SupportTicket', 'ResolveTicket', { ticketId, reason }, { json: true });

        return true;
    } catch (err) { console.error(err); throw err; }
}

export async function rejectTicket(ticketId: string, reason: string, uxpContext: IContextProvider): Promise<boolean> {
    try {
        console.log('Rejecting Ticket...');

        await uxpContext.executeAction('SupportTicket', 'RejectTicket', { ticketId, reason }, { json: true });

        return true;
    } catch (err) { console.error(err); throw err; }
}

let responseCodes = {
    successCode: 1,
    errorCodes: {
        0: [
            { error: 'ERR_TICKET_ID_IS_EMPTY', message: 'Unable to perform operation. Support ticket id is empty.' },
            { error: 'ERR_TICKET_NOT_EXISTS', message: 'Unable to perform operation. Support ticket not exists.' },
            { error: 'ERR_TICKET_NOT_ACCEPTED', message: 'Unable to perform operation. Support ticket has already been accepted.' }
        ]
    }
}

const SupportTickets: React.FunctionComponent<ISupportTicketsProps> = (props) => {

    const { uxpContext } = props;

    let history = useHistory()
    const toast = useToast();

    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedTicket, setSelectedTicket] = React.useState<ISupportTicket>();

    const [isAccepting, setIsAccepting] = React.useState<boolean>(false);
    const [isRejecting, setIsRejecting] = React.useState<boolean>(false);
    const [isResolving, setIsResolving] = React.useState<boolean>(false);

    const [isSupportTicketInformationModalVisible, setIsSupportTicketInformationModalVisible] = React.useState(false);

    const [bookings, setBookings] = React.useState<any[]>([]);

    let [canResolveAndRejectTicket, setCanResolveAndRejectTicket] = React.useState(false)
    let [canAcceptTicket, setCanAcceptTicket] = React.useState(false)

    let memorizedRoles = React.useMemo(() => {
        return {
            list: ["canviewticket"],
            add: ["cancreateticket"],
            edit: [],
            delete: [],
        }
    }, [])


    React.useEffect(() => validatePermissions(), [])

    // Fetch Bookings in add
    React.useEffect(() => {
        setIsLoading(true);
        fetchBookings(uxpContext).then(
            (result) => setBookings(
                result?.map((r) => (
                    {
                        ...r,
                        displayText: `${r?.bookingId} - ${r?.vehiclePlateIdentifier}`
                    }
                ))
            )
        )
            .catch((err) => {
                toast.error('Error while retrieving booking records. Please refresh...');
            }).finally(() => {
                setIsLoading(false);
            });
    }, []);

    const validatePermissions = () => {
        hasRole(uxpContext, 'canacceptticket').then(setCanAcceptTicket)
        hasRole(uxpContext, 'canresolveticket').then((val) => setCanResolveAndRejectTicket)
    }

    const handleOnClickAcceptTicket = (ticket: ISupportTicket) => {
        setSelectedTicket(ticket)
        setIsAccepting(true);
    }

    const handleOnClickResolveTicket = (ticket: ISupportTicket) => {
        setSelectedTicket(ticket)
        setIsResolving(true);
    }

    const handleOnClickRejectTicket = (ticket: ISupportTicket) => {
        setSelectedTicket(ticket)
        setIsRejecting(true);
    }

    const onAcceptTicket = async (ticketId: string) => {
        setIsLoading(true);
        try {
            await acceptTicket(ticketId, uxpContext)
            toast.success(`Ticket ${ticketId} was accepted successfully...`)
        } catch (e) {
            let { msg } = handleErrorResponse(e, responseCodes.errorCodes)
            toast.error(msg)
        }

        setIsLoading(false)
        setIsAccepting(false)
    }

    const onResolveTicket = async (ticketId: string, reason: string) => {
        setIsLoading(true);

        try {
            await resolveTicket(ticketId, reason, uxpContext)
            toast.success(`Ticket ${ticketId} was resolved successfully...`)
        } catch (e) {
            let { msg } = handleErrorResponse(e, responseCodes.errorCodes)
            toast.error(msg)
        }

        setIsLoading(false)
        setIsResolving(false)
    }

    const onRejectTicket = async (ticketId: string, reason: string) => {
        setIsLoading(true);

        try {
            await rejectTicket(ticketId, reason, uxpContext)
            toast.success(`Ticket ${ticketId} was rejected...`)
        } catch (e) {
            let { msg } = handleErrorResponse(e, responseCodes.errorCodes)
            toast.error(msg)
        }

        setIsLoading(false)
        setIsRejecting(false)
    }

    const getBooking = (bookingId: string) => bookings?.find(b => b.bookingId == bookingId);

    return <>
        <Conditional visible={isLoading}>
            <div className="loading-text">
                <Loading />
                <span style={{ marginTop: '20px' }}>Loading Booking Information </span>
            </div>
        </Conditional>

        <SupportTicketInformationModal
            onClose={() => setIsSupportTicketInformationModalVisible(false)}
            show={isSupportTicketInformationModalVisible}
            ticket={selectedTicket}
            uxpContext={uxpContext}
        />

        <ConfirmPopup
            show={isAccepting}
            onConfirm={{
                execute: () => onAcceptTicket(selectedTicket?._id),
                onComplete: () => { },
                onError: (e) => { }
            }}
            onCancel={() => setIsAccepting(false)}
            message={`Confirm accepting ticket`}
            processingMessage={`Accepting ticket...`}
        />

        <InputPopup
            show={isResolving}
            onConfirm={{
                execute: (reason) => onResolveTicket(selectedTicket?._id, reason),
                onComplete: () => { },
                onError: (e) => { }
            }}
            onCancel={() => setIsResolving(false)}
            message={`Reason for resolving`}
            processingMessage={`Resolving ticket...`}
        />

        <InputPopup
            show={isRejecting}
            onConfirm={{
                execute: (reason) => onRejectTicket(selectedTicket?._id, reason),
                onComplete: () => { },
                onError: (e) => { }
            }}
            onCancel={() => setIsRejecting(false)}
            message={`Reason for rejecting`}
            processingMessage={`Rejecting ticket...`}
        />

        <Conditional visible={!isLoading}>
            <div className="page-content">
                <CrudComponent
                    entityName='SupportTickets'
                    uxpContext={uxpContext}
                    roles={memorizedRoles}
                    list={{
                        default: {
                            model: "SupportTicket",
                            action: "AllTickets",
                            itemId: "_id",
                            responseCodes: {
                                successCode: 1,
                                errorCodes: {
                                    0: [
                                        { error: 'ERR_FETCHING_TICKETS', message: 'Unable to retrieve tickets. Something went wrong' }
                                    ]
                                }
                            },
                            columns: [
                                {
                                    name: "Status",
                                    valueField: "status",
                                    columnWidth: '150px',
                                    renderColumn: (item) => (
                                        <div style={{ fontWeight: 'bold' }}>{item['status']}</div>
                                    ),
                                },
                                {
                                    name: "Booking",
                                    valueField: "bookingId",
                                    columnWidth: '150px'
                                },
                                {
                                    name: "Vehicle Plate",
                                    valueField: "vehiclePlateIdentifier",
                                    columnWidth: '150px',
                                },
                                {
                                    name: "Time",
                                    valueField: "createdAt",
                                    columnWidth: '150px',
                                    renderColumn: (item) => (
                                        <div>{item['createdAt'] ? new Date(item['createdAt']).toLocaleString() : 'N/A'}</div>
                                    ),
                                },
                                {
                                    name: "Description",
                                    valueField: "description",
                                    columnWidth: '230px',
                                },
                                {
                                    name: "Actions",
                                    columnWidth: '',
                                    renderColumn: (ticket) => {
                                        return (
                                            <SupportTicketActionPanel
                                                ticket={ticket}
                                                canAcceptTicket={canAcceptTicket}
                                                canResolveAndRejectTicket={canResolveAndRejectTicket}
                                                onViewTicket={(ticket) => {
                                                    setSelectedTicket(ticket);
                                                    setIsSupportTicketInformationModalVisible(true);
                                                }}
                                                onAcceptTicket={handleOnClickAcceptTicket}
                                                onResolveTicket={handleOnClickResolveTicket}
                                                onRejectTicket={handleOnClickRejectTicket}
                                            />
                                        )
                                    }
                                },
                            ],
                            showActionButtons: false,
                            toolbar: {
                                search: {
                                    show: false,
                                    searchableFields: ["status", "bookingId", "vehiclePlateIdentifier"]
                                }
                            }
                        }
                    }}
                    add={{
                        default: {
                            model: "SupportTicket",
                            action: "NewSupportTicket",
                            responseCodes: {
                                successCode: 1,
                                successMessage: "New support ticket created",
                                errorCodes: {
                                    0: [
                                        { error: 'ERR_CREATING_TICKET', message: 'Unable to create new ticket. Server error...' },
                                        { error: 'ERR_BOOKING_ID_IS_EMPTY', message: 'Unable to create new ticket. Booking ID is required' },
                                        { error: 'ERR_BOOKING_NOT_EXISTS', message: 'Unable to create new ticket. Booking doesn\'t exists' },
                                        { error: 'ERR_INVALID_BOOKING_FOR_ONSTREETPARKING', message: 'A ticket can not be created before 5 minutes of the start time and not after 5 minutes of the leaving time of a valid paid On-street booking.' },
                                        { error: 'ERR_INVALID_BOOKING_FOR_OFFSTREETPARKING', message: 'A ticket can not be created after 5 minutes of a valid paid booking for the Off-street booking.' },
                                    ]
                                }
                            },
                            formStructure: [
                                {
                                    label: "Booking",
                                    name: "bookingId",
                                    type: "select",
                                    options: bookings,
                                    valueField: "bookingId",
                                    labelField: "displayText",
                                    validate: {
                                        required: true
                                    }
                                },
                                {
                                    label: "Parking Site",
                                    name: "parkingSite",
                                    type: "calculated",
                                    calculateValue: (item) => getBooking(item['bookingId'])?.parkingSiteName,
                                },
                                {
                                    label: "Parking Group",
                                    name: "parkingGroup",
                                    type: "calculated",
                                    calculateValue: (item) => getBooking(item['bookingId'])?.parkingGroupName,
                                },
                                {
                                    label: "Parking Spot",
                                    name: "parkingSpot",
                                    type: "calculated",
                                    calculateValue: (item) => getBooking(item['bookingId'])?.parkingSpotName,
                                },
                                {
                                    label: "Vehicle Plate Identifier",
                                    name: "vehiclePlateIdentifier",
                                    type: "calculated",
                                    calculateValue: (item) => getBooking(item['bookingId'])?.vehiclePlateIdentifier,
                                },
                                {
                                    label: "Amount",
                                    name: "amount",
                                    type: "calculated",
                                    calculateValue: (item) => getBooking(item['bookingId'])?.chargesPaid?.amount,
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
                            afterSave: () => { history.push("/support-tickets") },
                            onCancel: () => { history.push("/support-tickets") }
                        }
                    }}
                />
            </div>
        </Conditional>
    </>
}

interface ISupportTicketActionPanelProps {
    ticket: any,
    canAcceptTicket: boolean,
    canResolveAndRejectTicket: boolean,
    onAcceptTicket?: (ticket: ISupportTicket) => any,
    onResolveTicket?: (ticket: ISupportTicket) => any,
    onRejectTicket?: (ticket: ISupportTicket) => any,
    onViewTicket?: (ticket: ISupportTicket) => void
}

const SupportTicketActionPanel: React.FunctionComponent<ISupportTicketActionPanelProps> = (props) => {
    return (
        <div className="mda-spa-crud-list-action-column">
            <Conditional visible={props.canAcceptTicket}>
                {props.ticket?.status?.toLowerCase() === 'new' && (
                    <Button
                        icon={`${checkCircleIcon}`}
                        title={'Accept'}
                        onClick={() => props.onAcceptTicket(props.ticket)}
                    />
                )}
            </Conditional>
            
            {props.ticket?.status?.toLowerCase() === 'in progress' && (
                <>
                    <Conditional visible={props.canResolveAndRejectTicket}>
                        <Button
                            icon={`${checkCircleIcon}`}
                            title={'Resolve'}
                            onClick={() => props.onResolveTicket(props.ticket)}
                        />
                        <Button
                            icon={`${tickCrossIcon}`}
                            title={'Reject'}
                            onClick={() => props.onRejectTicket(props.ticket)}
                        />
                    </Conditional>
                </>
            )}

            <Button
                icon={`${ticketIcon}`}
                title={'View'}
                onClick={() => props.onViewTicket(props.ticket)}
            />
        </div>
    )
}

export default SupportTickets