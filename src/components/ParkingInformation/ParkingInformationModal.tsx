import GeoJson from 'geojson';
import * as React from 'react'
import { Button, Checkbox, FormField, Input, ItemCard, Label, Loading, Modal, Select, useToast } from 'uxp/components';
import { Map, TileLayer, LayerGroup, Polygon, Tooltip } from "react-leaflet";
import { IContextProvider } from '../../uxp';
import "leaflet-editable";
import { useState } from 'react';
import { ChargeType, createNewParkingGroup, editParkingGroup, findParkingGroupById, IParkingGroup, RequiredPermitType } from './ParkingGroup';
import { createNewParkingSite, editParkingSite, findOffStreetParkingSiteById, findOnStreetParkingSiteById, findParkingSiteById, IParkingSite, ParkingSiteType } from './ParkingSite';
import { createNewParkingSpot, editParkingSpot, findParkingSpotById, IParkingSpot, ParkingSpotStatusType } from './ParkingSpot';
import { Conditional } from '../common/ConditionalComponent';
import { ValidatableForm, ValidatableFormField, ValidatableFormRef } from '../common/ValidatableForm';
import { ParkingInformationContext } from './ParkingInformation';
import { handleErrorResponse } from '../../utils';

export type ParkingInfomationType = 'parkingspot' | 'parkinggroup' | 'parkingsite'
export type ModalState = 'create' | 'edit' | 'view';
interface IParkingInfoModalProps {
    uxpContext: IContextProvider,
    show: boolean,
    location?: GeoJson.Polygon | GeoJson.Point,
    /**
     * Changing state represents changing type (Parking Spot, Parking Group, Parking Site)
     */
    parkingInformationType: ParkingInfomationType,
    parkingInformation?: IParkingGroup | IParkingSite | IParkingSpot,
    modalState: ModalState;

    /** Parent's information used only while creating parking spot or parking group */
    parentParkingSite?: IParkingSite;
    parentParkingGroup?: IParkingGroup;

    onClose?: () => any,
    afterSave?: (info: IParkingGroup | IParkingSite | IParkingSpot) => any,
}

const ParkingInfomationModal: React.VoidFunctionComponent<IParkingInfoModalProps> = (props) => {

    const {
        parkingSites,
        parkingGroups,
        parkingSpots
    } = React.useContext(ParkingInformationContext);

    const toast = useToast();
    const modalState = props.modalState

    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const parkingSitesSectionRef = React.useRef<ValidatableFormRef>();
    const parkingGroupSectionRef = React.useRef<ValidatableFormRef>();
    const parkingSpotSectionRef = React.useRef<ValidatableFormRef>();

    // Represents the data needs to fill the parking site section
    const [parkingSiteSectionData, setParkingSiteSectionData] = useState<ParkingSiteSectionDataType>()

    // Represents the data needs to fill the parking group section
    const [parkingGroupSectionData, setParkingGroupSectionData] = useState<ParkingGroupSectionDataType>()

    // Represents the data needs to fill the parking spot section
    const [parkingSpotSectionData, setParkingSpotSectionData] = useState<ParkingSpotSectionDataType>()

    const clearAllFields = () => {
        setParkingSiteSectionData(null);
        setParkingGroupSectionData(null);
        setParkingSpotSectionData(null);
        parkingSitesSectionRef.current?.refresh();
        parkingGroupSectionRef.current?.refresh();
        parkingSpotSectionRef.current?.refresh();
    }

    const handleSaveButtonClick = async () => {
        try {
            if (props.parkingInformationType === 'parkingsite') {
                const errors = parkingSitesSectionRef.current?.validateFields(true);
                if (Object.keys(errors).length > 0) {
                    return;
                }

                setIsLoading(true);

                let type = parkingSiteSectionData.type;
                let id = null;

                if (modalState === 'create') {
                    id = await createNewParkingSite({ ...parkingSiteSectionData, location: props.location }, type, props.uxpContext)
                } else {
                    const editingParkingSite = (props.parkingInformation as IParkingSite)
                    id = editingParkingSite?.[`${editingParkingSite?.type}.id`];
                    await editParkingSite(id, { ...parkingSiteSectionData }, type, props.uxpContext);
                }

                const parkingSite = await findParkingSiteById(id, type, props.uxpContext)
                props.afterSave(parkingSite);
            } else if (props.parkingInformationType === 'parkinggroup') {

                const errors = parkingGroupSectionRef.current?.validateFields(true);
                if (Object.keys(errors).length > 0) {
                    return;
                }

                setIsLoading(true);

                let id = null;
                if (modalState === 'create') {
                    id = await createNewParkingGroup({
                        ...parkingGroupSectionData,
                        ['ParkingGroup.location']: props.location,
                        ['ParkingGroup.refParkingSite']: props.parentParkingSite?.[`${props.parentParkingSite?.type}.id`],
                        ['ParkingGroup.category']: props.parentParkingSite?.type,
                        smartBillingCapable: !!parkingGroupSectionData['smartBillingCapable'],
                    }, props.uxpContext);
                } else {
                    id = (props.parkingInformation as IParkingGroup)['ParkingGroup.id']

                    await editParkingGroup(id, {
                        ...parkingGroupSectionData,
                        smartBillingCapable: !!parkingGroupSectionData['smartBillingCapable']
                    }, props.uxpContext);
                }

                const parkingGroup = await findParkingGroupById(id, props.uxpContext)
                props.afterSave(parkingGroup);
            } else if (props.parkingInformationType === 'parkingspot') {
                const errors = parkingSpotSectionRef.current?.validateFields(true);
                if (Object.keys(errors).length > 0) {
                    return;
                }

                setIsLoading(true);

                let id = null;
                if (modalState === 'create') {
                    id = await createNewParkingSpot({
                        ...parkingSpotSectionData,
                        ['ParkingSpot.location']: props.location,
                        ['ParkingSpot.refParkingGroup']: props.parentParkingGroup?.['ParkingGroup.id'],
                        ['ParkingSpot.category']: props.parentParkingGroup['ParkingGroup.category'],
                    }, props.uxpContext);
                } else {
                    id = (props.parkingInformation as IParkingSpot)['ParkingSpot.id']

                    await editParkingSpot(id, { ...parkingSpotSectionData }, props.uxpContext);
                }

                const parkingSpot = await findParkingSpotById(id, props.uxpContext)
                props.afterSave(parkingSpot);
            }

            clearAllFields();
        } catch (err) {
            const { msg: errorMessage } = handleErrorResponse(err, {
                103802: [
                    { error: 'ERR_CREATING_ONSTREET_PARKING_SITE', message: 'Error creating onstreet parking site....' },
                    { error: 'ERR_CREATING_OFFSTREET_PARKING_SITE', message: 'Error creating offstreet parking site....' },
                    { error: 'ERR_PARKING_OPERATOR_IS_INVALID', message: 'Error... Parking operator is invalid.' },
                    { error: 'ERR_PARKING_OPERATOR_IS_EMPTY', message: 'Error... Parking operator is empty.' },
                    { error: 'ERR_LOCATION_IS_INVALID', message: 'Error... Location is invalid.' },
                    { error: 'ERR_LOCATION_IS_EMPTY', message: 'Error... Location is empty.' },
                    { error: 'ERR_NAME_IS_EMPTY', message: 'Error... Site name is empty.' },

                    { error: 'ERR_UPDATING_ONSTREET_PARKING_SITE', message: 'Error updating on street parking site...' },
                    { error: 'ERR_UPDATING_OFFSTREET_PARKING_SITE', message: 'Error updating off street parking site...' },
                    { error: 'ERR_PARKING_SITE_NOT_FOUND', message: 'Error.... site doesn\'t exist anymore' },
                ],
                101402: [
                    { error: 'ERR_CREATING_GROUP', message: 'Error creating parking group....' },
                    { error: 'ERR_AVAILABLE_SPOT_EXCEEDS_TOTAL', message: 'Error... Available spots exceeds the total spots.' },
                    { error: 'ERR_REF_PARKING_SITE_IS_INVALID', message: 'Error... Parking site is empty.' },
                    { error: 'ERR_REF_PARKING_SITE_IS_EMPTY', message: 'Error... Parking site is invalid.' },
                    { error: 'ERR_OCCUPANCY_DETECTION_TYPE_IS_INVALID', message: 'Error... Occupancy detection type is invalid.' },
                    { error: 'ERR_OCCUPANCY_DETECTION_TYPE_IS_EMPTY', message: 'Error...  Occupancy detection type is empty.' },
                    { error: 'ERR_PERMIT_TYPE_IS_INVALID', message: 'Error... Permit type is invalid.' },
                    { error: 'ERR_CHARGE_TYPE_IS_INVALID', message: 'Error... Charge type is invalid.' },
                    { error: 'ERR_CHARGE_TYPE_IS_EMPTY', message: 'Error... Charge type is empty.' },
                    { error: 'ERR_MAXIMUM_PARKING_DURATION_IS_EMPTY', message: 'Error... maximum parking duration is empty' },
                    { error: 'ERR_ADDRESS_IS_EMPTY', message: 'Error... address is empty.' },
                    { error: 'ERR_ALLOWED_VEHICLE_TYPE_IS_INVALID', message: 'Error... allowed vehicle type is invalid' },
                    { error: 'ERR_ALLOWED_VEHICLE_TYPE_IS_EMPTY', message: 'Error... allowed vehicle type is empty' },
                    { error: 'ERR_LOCATION_IS_INVALID', message: 'Error... location is invalid' },
                    { error: 'ERR_LOCATION_IS_EMPTY', message: 'Error... location is empty' },
                    { error: 'ERR_CATEGORY_IS_INVALID', message: 'Error... invalid parking group category' },
                    { error: 'ERR_CATEGORY_IS_EMPTY', message: 'Error... category name is empty' },
                    { error: 'ERR_NAME_IS_EMPTY', message: 'Error... name of the parking group is empty' },

                    { error: 'ERR_UPDATING_GROUP', message: 'Error updating group....' },
                    { error: 'ERR_GROUP_NOT_FOUND', message: 'Error.... group doesn\'t exist anymore' },
                ],
                101502: [
                    { error: 'ERR_CREATING_SPOT', message: 'Error creating parking spot....' },
                    { error: 'ERR_LOCATION_IS_INVALID', message: 'Error... location is invalid' },
                    { error: 'ERR_LOCATION_IS_EMPTY', message: 'Error... location is empty' },
                    { error: 'ERR_STATUS_IS_EMPTY', message: 'Error... status is invalid' },
                    { error: 'ERR_STATUS_IS_EMPTY', message: 'Error... status is empty' },
                    { error: 'ERR_PARKING_GROUP_IS_EMPTY', message: 'Error... Parking group is empty.' },
                    { error: 'ERR_PARKING_GROUP_IS_INVALID', message: 'Error... Parking group is invalid.' },
                    { error: 'ERR_PARKING_GROUP_CAPACITY_REACHED', message: 'Error... Parking group capacity reached.' },

                    { error: 'ERR_UPDATING_SPOT', message: 'Error updating spot....' },
                    { error: 'ERR_SPOT_NOT_FOUND', message: 'Error.... spot doesn\'t exist anymore' },
                ],
            });
            toast.error(`${errorMessage}`);
            console.error(err)
        } finally {
            setIsLoading(false);
        }

    }

    const handleCancelButtonClick = () => {
        clearAllFields();
        props.onClose();
    }

    React.useEffect(() => {
        if (!props.show) return;
        if (props.parkingInformationType === 'parkingsite') {
            if (modalState === 'edit') {
                if (!props.parkingInformation) return;
                let parkingSite = props.parkingInformation as IParkingSite;
                retrieveParkingSiteInfoOfEditingParkingSite(parkingSite[`${parkingSite?.type}.id`], parkingSite?.type)
            }
        } else if (props.parkingInformationType === 'parkinggroup') {
            const parkingGroup = props.parkingInformation as IParkingGroup;

            const parentParkingSite = !!parkingGroup ? (parkingSites.find((site) => site[`${site?.type}.id`] === parkingGroup['ParkingGroup.refParkingSite']))
                : props.parentParkingSite;

            if (!parentParkingSite) return;

            setParkingSiteSectionData({
                name: parentParkingSite[`${parentParkingSite?.type}.name`],
                refParkingOperator: parentParkingSite['refParkingOperator'],
                type: parentParkingSite?.type,
            })

            if (modalState === 'edit') {
                if (!props.parkingInformation) return;
                retrieveParkingGroupInfoOfEditingParkingGroup(parkingGroup['ParkingGroup.id'])
            }
        } else if (props.parkingInformationType === 'parkingspot') {
            const parkingSpot = props.parkingInformation as IParkingSpot

            const parentParkingGroup = !!parkingSpot ? parkingGroups.find((group) => group['ParkingGroup.id'] === parkingSpot['ParkingSpot.refParkingGroup'])
                : props.parentParkingGroup;

            if (!parentParkingGroup) return;

            const parentParkingSite = parkingSites.find(
                (site) => site[`${site?.type}.id`] === parentParkingGroup['ParkingGroup.refParkingSite']
            );

            setParkingSiteSectionData({
                name: parentParkingSite[`${parentParkingSite?.type}.name`],
                refParkingOperator: parentParkingSite['refParkingOperator'],
                type: parentParkingSite?.type,
            })

            setParkingGroupSectionData({ ...parentParkingGroup })

            if (modalState === 'edit') {
                if (!props.parkingInformation) return;
                let editingParkingSpot = props.parkingInformation as IParkingSpot;
                retrieveParkingSpotInfoOfEditingParkingSpot(editingParkingSpot['ParkingSpot.id'])
            }

            /**  Wait some time and scroll to bottom. Genius solution or ugly hack? */
            setTimeout(() => {
                document.getElementById("modal-control-panel")?.scrollIntoView({ behavior: 'smooth' });
            }, 400)

        }

    }, [props.show])

    const retrieveParkingSiteInfoOfEditingParkingSite = async (id: string, type: ParkingSiteType) => {
        let site = await findParkingSiteById(id, type, props.uxpContext);

        setParkingSiteSectionData({
            name: site[`${site?.type}.name`],
            refParkingOperator: site['refParkingOperator'],
            type,
        })
    }

    const retrieveParkingGroupInfoOfEditingParkingGroup = async (id: string) => {
        let group = await findParkingGroupById(id, props.uxpContext);
        setParkingGroupSectionData({ ...group })
    }

    const retrieveParkingSpotInfoOfEditingParkingSpot = async (id: string) => {
        let spot = await findParkingSpotById(id, props.uxpContext);
        setParkingSpotSectionData({ ...spot })
    }

    return (
        <Modal
            className="parking-information-modal"
            show={props.show} title="MDA Smart Parking | Manage Parking Information"
            onClose={() => {
                handleCancelButtonClick();
            }}>
            <ParkingSiteSection
                ref={parkingSitesSectionRef}
                uxpContext={props.uxpContext}
                data={parkingSiteSectionData}
                onValuesChange={(data) => { setParkingSiteSectionData(data) }}
                disabled={props.parkingInformationType !== 'parkingsite'} />

            <Conditional visible={props.parkingInformationType === 'parkinggroup' || props.parkingInformationType === 'parkingspot'}>
                <ParkingGroupSection
                    ref={parkingGroupSectionRef}
                    uxpContext={props.uxpContext}
                    parkingGroupType={parkingSiteSectionData?.type}
                    data={parkingGroupSectionData}
                    onValuesChange={(data) => { setParkingGroupSectionData(data) }}
                    disabled={props.parkingInformationType !== 'parkinggroup'} />
            </Conditional>

            <Conditional visible={props.parkingInformationType === 'parkingspot'}>
                <ParkingSpotSection
                    ref={parkingSpotSectionRef}
                    uxpContext={props.uxpContext}
                    data={parkingSpotSectionData}
                    onValuesChange={(data) => { setParkingSpotSectionData(data) }}
                    disabled={props.parkingInformationType !== 'parkingspot'} />
            </Conditional>

            <div className="control-panel" id="modal-control-panel">
                <FormField className="control-panel-field" inline>
                    <Button className="button" title="Save" loading={isLoading} loadingTitle="Saving..." onClick={handleSaveButtonClick} />
                    <Button className="button" title="Cancel" onClick={handleCancelButtonClick} />
                </FormField>
            </div>
        </Modal>
    )
}

type ParkingSiteSectionDataType = {
    name: string,
    type: ParkingSiteType,
    refParkingOperator: string,
};

interface IParkingSiteSectionProps {
    data: ParkingSiteSectionDataType,
    disabled: boolean,
    uxpContext: IContextProvider,
    onValuesChange: (data: ParkingSiteSectionDataType) => void,
}

const ParkingSiteSection = React.forwardRef<ValidatableFormRef, React.PropsWithChildren<IParkingSiteSectionProps>>((props, ref) => {

    const [parkingOperators, setParkingOperators] = React.useState([]);

    const retrieveParkingOperators = async () => {
        try {
            const result = await props.uxpContext.executeAction("ParkingOperator", "operatorsAll", {}, { json: true });
            setParkingOperators(result?.data);
        } catch (err) { console.error(err); }
    }

    React.useEffect(() => {
        retrieveParkingOperators();
    }, [])

    return (
        <div className="section" id="parking-site-section">
            <h4 className="title">Parking Site</h4>
            <div className="form-field-group">
                <ValidatableForm
                    validateSchema={{
                        name: { fieldName: 'name', label: 'Site name', validatorCollection: ['isRequired'] },
                        type: { fieldName: 'type', label: 'Parking type', validatorCollection: ['isRequired'] },
                        refParkingOperator: { fieldName: 'refParkingOperator', label: 'Parking operator', validatorCollection: ['isRequired'] },
                    }}
                    ref={ref}>

                    <ValidatableFormField fieldName="name" label="Site Name" value={props.data?.name}>
                        <Input
                            placeholder="Name of parking site"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, name: value })}
                            value={props.data?.name ?? ''}
                            isValid={props.disabled ? undefined : !!props.data?.name}
                            hasIndicator={!props.disabled}
                        />
                    </ValidatableFormField>
                    <ValidatableFormField fieldName="type" label="Parking Type *" value={props.data?.type}>
                        <Select
                            placeholder="Parking site type"
                            options={[
                                { label: 'On Street parking', value: 'OnStreetParking' },
                                { label: 'Off Street parking', value: 'OffStreetParking' }
                            ]}

                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, type: value as ParkingSiteType })}
                            showEndOfContent={false}
                            selected={props.data?.type ?? ''}
                            isValid={props.disabled ? undefined : !!props.data?.type}
                        />
                    </ValidatableFormField>
                    <ValidatableFormField fieldName="refParkingOperator" label="Parking Operator *" value={props.data?.refParkingOperator}>
                        <Select
                            placeholder="Parking operator"
                            options={parkingOperators}
                            labelField="companyName"
                            valueField="_id"
                            showEndOfContent={false}
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, refParkingOperator: value })}
                            selected={props.data?.refParkingOperator ?? ''}
                            isValid={props.disabled ? undefined : !!props.data?.refParkingOperator}
                        />
                    </ValidatableFormField>
                </ValidatableForm>
            </div>
        </div>
    )
});

type ParkingGroupSectionDataType = {
    'ParkingGroup.name': string;
    'ParkingGroup.requiredPermit': RequiredPermitType;
    'ParkingGroup.chargeType': string[];
    'ParkingGroup.allowedVehicleType': string;
    'ParkingGroup.image': null;
    'ParkingGroup.maximumAllowedHeight': number | null;
    'ParkingGroup.maximumAllowedWidth': number | null;
    securePreBookingDuration: number;
    gracePeriod: number;
    smartBillingCapable: boolean;
    'ParkingGroup.areBordersMarked': boolean;
    'ParkingGroup.maximumParkingDuration': number;
    'ParkingGroup.occupancyDetectionType': string;
    'ParkingGroup.address': string;
    'ParkingGroup.totalSpotNumber': number;
    'ParkingGroup.availableSpotNumber': number;
    chargeGranularity: number;
    chargeUnitPrice: number;
    [key: string]: any;
};

interface IParkingGroupSectionProps {
    uxpContext: IContextProvider;
    data: ParkingGroupSectionDataType;
    disabled: boolean;
    parkingGroupType: ParkingSiteType,
    onValuesChange: (data: ParkingGroupSectionDataType) => void;
}

const ParkingGroupSection = React.forwardRef<ValidatableFormRef, React.PropsWithChildren<IParkingGroupSectionProps>>((props, ref) => {

    let handleCollectionOfAllowedVehicleChange = (checked: boolean, name: string) => {
        if (props.disabled) return;

        if (checked) {
            props.onValuesChange({ ...props.data, ['ParkingGroup.allowedVehicleType']: name })
        } else {
            props.onValuesChange({ ...props.data, ['ParkingGroup.allowedVehicleType']: '' })
        }
    }


    return (
        <div className="section" id="parking-group-section">
            <h4 className="title">Parking Group</h4>
            <ValidatableForm
                validateSchema={{
                    ['ParkingGroup.name']: { fieldName: 'ParkingGroup.name', label: 'Name of parking group', validatorCollection: ['isRequired'] },
                    ['ParkingGroup.chargeType']: { fieldName: 'ParkingGroup.chargeType', label: 'Charge type', validatorCollection: ['isRequired'] },
                    ['ParkingGroup.maximumParkingDuration']: { fieldName: 'ParkingGroup.maximumParkingDuration', label: 'Maximum parking duration', validatorCollection: ['isRequired'] },
                    ['ParkingGroup.address']: { fieldName: 'ParkingGroup.address', label: 'Address', validatorCollection: ['isRequired'] },
                    ['ParkingGroup.allowedVehicleType']: { fieldName: 'ParkingGroup.allowedVehicleType', label: 'Allowed vehicle types', validatorCollection: ['isRequired'] },
                    ['ParkingGroup.totalSpotNumber']: { fieldName: 'ParkingGroup.totalSpotNumber', label: 'Total spot number', validatorCollection: ['isRequired'] },
                }}
                ref={ref}>

                <div className="form-field-group">
                    <ValidatableFormField fieldName="ParkingGroup.name" label="Group Name *" value={props.data?.['ParkingGroup.name']}>
                        <Input
                            placeholder="Name of parking group"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.name']: value })}
                            value={props.data?.['ParkingGroup.name'] ?? ''}
                            isValid={props.disabled ? undefined : !!props.data?.['ParkingGroup.name']}
                            hasIndicator={!props.disabled}
                        />
                    </ValidatableFormField>

                    <FormField className="form-field">
                        <Label>Permit Type</Label>
                        <Select
                            placeholder="Permit Type"
                            options={[
                                { label: 'Employee Permit', value: 'employeePermit' },
                                { label: 'Student Permit', value: 'studentPermit' },
                                { label: 'Fair Permit', value: 'fairPermit' },
                                { label: 'Government Permit', value: 'governmentPermit' },
                                { label: 'Resident Permit', value: 'residentPermit' },
                                { label: 'Disabled Permit', value: 'disabledPermit' }
                            ]}
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.requiredPermit']: value as RequiredPermitType })}
                            selected={props.data?.['ParkingGroup.requiredPermit'] ?? ''}
                            isValid={props.disabled ? undefined : true}
                        />
                    </FormField>

                    <ValidatableFormField fieldName="ParkingGroup.chargeType" label="Charge Type *" value={props.data?.['ParkingGroup.chargeType']}>
                        <Select
                            placeholder="Charge Type"
                            options={[
                                { label: 'Additional Interval Price', value: 'additionalIntervalPrice' },
                                { label: 'Annual Payment', value: 'annualPayment' },
                                { label: 'Free', value: 'free' },
                                { label: 'Season Ticket', value: 'seasonTicket' },
                                { label: 'Other', value: 'other' }
                            ]}
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.chargeType']: [value] })}
                            selected={(props.data?.['ParkingGroup.chargeType'] && props.data['ParkingGroup.chargeType'].length > 0) ? (props.data['ParkingGroup.chargeType'][0] ?? '') : ''}
                            isValid={props.disabled ? undefined : !!props.data?.['ParkingGroup.chargeType']}
                        />
                    </ValidatableFormField>

                    <FormField className="form-field">
                        <Label>Maximum Allowed Height(Meters)</Label>
                        <Input
                            type="number"
                            placeholder="Maximum Allowed Height"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.maximumAllowedHeight']: parseFloat(value) > 0 ? parseFloat(value) : 0})}
                            value={props.data?.['ParkingGroup.maximumAllowedHeight'] ? props.data['ParkingGroup.maximumAllowedHeight'].toString() : ''}
                            isValid={props.disabled ? undefined : true}
                            hasIndicator={!props.disabled}
                        />
                    </FormField>

                    <FormField className="form-field">
                        <Label>Maximum Allowed Width(Meters)</Label>
                        <Input
                            type="number"
                            placeholder="Maximum Allowed Width"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.maximumAllowedWidth']: parseFloat(value) > 0 ? parseFloat(value) : 0})}
                            value={props.data?.['ParkingGroup.maximumAllowedWidth'] ? props.data['ParkingGroup.maximumAllowedWidth'].toString() : ''}
                            isValid={props.disabled ? undefined : true}
                            hasIndicator={!props.disabled}
                        />
                    </FormField>

                    <ValidatableFormField fieldName="ParkingGroup.maximumParkingDuration" label="Maximum Parking Duration * (Minutes)" value={props.data?.['ParkingGroup.maximumParkingDuration']}>
                        <Input
                            type="number"
                            placeholder="Maximum Parking Duration *"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.maximumParkingDuration']: parseFloat(value) > 0 ? parseFloat(value) : 0})}
                            value={props.data?.['ParkingGroup.maximumParkingDuration'] ? props.data['ParkingGroup.maximumParkingDuration'].toString() : ''}
                            isValid={props.disabled ? undefined : !!props.data?.['ParkingGroup.maximumParkingDuration']}
                            hasIndicator={!props.disabled}
                        />
                    </ValidatableFormField>

                    <ValidatableFormField fieldName="ParkingGroup.address" label="Address *" value={props.data?.['ParkingGroup.address']}>
                        <Input
                            placeholder="Address"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.address']: value })}
                            value={props.data?.['ParkingGroup.address'] ?? ''}
                            isValid={props.disabled ? undefined : !!props.data?.['ParkingGroup.address']}
                            hasIndicator={!props.disabled}
                        />
                    </ValidatableFormField>

                    <Conditional visible={props.parkingGroupType != 'OnStreetParking'}>
                        <FormField className="form-field">
                            <Label>Secure Pre-Booking Duration (Minutes)</Label>
                            <Input
                                type="number"
                                placeholder="Secure Pre-Booking Duration"
                                onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, securePreBookingDuration: parseFloat(value) > 0 ? parseFloat(value) : 0 })}
                                value={props.data?.securePreBookingDuration ? props.data.securePreBookingDuration.toString() : ''}
                                isValid={props.disabled ? undefined : true}
                                hasIndicator={!props.disabled}
                            />
                        </FormField>
                    
                        <FormField className="form-field">
                            <Label>Grace Period (Minutes)</Label>
                            <Input
                                type="number"
                                placeholder="Grace Period"
                                onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, gracePeriod: parseFloat(value) > 0 ? parseFloat(value) : 0 })}
                                value={props.data?.gracePeriod ? props.data.gracePeriod.toString() : ''}
                                isValid={props.disabled ? undefined : true}
                                hasIndicator={!props.disabled}
                            />
                        </FormField>
                    </Conditional>
                    

                    <ValidatableFormField fieldName="ParkingGroup.totalSpotNumber" label="Total Spot Count" value={props.data?.['ParkingGroup.totalSpotNumber']}>
                        <Input
                            type="number"
                            placeholder="Total Spot Number *"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.totalSpotNumber']: parseFloat(value) > 0 ? parseFloat(value) : 0 })}
                            value={props.data?.['ParkingGroup.totalSpotNumber'] ? props.data['ParkingGroup.totalSpotNumber'].toString() : ''}
                            isValid={props.disabled ? undefined : !!props.data?.['ParkingGroup.totalSpotNumber']}
                            hasIndicator={!props.disabled}
                        />

                    </ValidatableFormField>


                    <FormField className="form-field">
                        <Label>Occupied Spot Count</Label>
                        <Input
                            className="occupied-spot-count"
                            placeholder="Occupied Spot Count"
                            onChange={(value) => { }}
                            value={'0 Spots Occupied'}
                        />
                    </FormField>

                    <FormField className="form-field">
                        <Label>Available Spot Count</Label>
                        <Input
                            className="available-spot-count"
                            placeholder="Available Spot Count"
                            onChange={(value) => { }}
                            value={(props.data?.['ParkingGroup.totalSpotNumber'] ?? '0') + ' Spots Available'}
                        />
                    </FormField>

                    <FormField className="form-field">
                        <Label>Occupancy Detection Type</Label>
                        <Select
                            placeholder="Occupancy Detection Type"
                            options={[
                                { label: 'Additional Interval Price', value: 'balancing' },
                                { label: 'Manual', value: 'manual' },
                                { label: 'Model Based', value: 'modelBased' },
                                { label: 'None', value: 'none' },
                                { label: 'Single Space Detection', value: 'singleSpaceDetection' }
                            ]}
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.occupancyDetectionType']: value })}
                            selected={props.data?.['ParkingGroup.occupancyDetectionType'] ?? ''}
                            isValid={props.disabled ? undefined : true}
                        />
                    </FormField>


                    <ValidatableFormField
                        fieldName="ParkingGroup.allowedVehicleType"
                        label="Allowed Vehicles"
                        value={props.data?.['ParkingGroup.allowedVehicleType']}>

                        <Checkbox
                            checked={props.data?.['ParkingGroup.allowedVehicleType'] === 'car'}
                            onChange={(checked) => handleCollectionOfAllowedVehicleChange(checked, 'car',)}
                            label={'Allow Cars'}
                            type={'switch-box'}
                        />
                        <Checkbox
                            checked={props.data?.['ParkingGroup.allowedVehicleType'] === 'truck'}
                            onChange={(checked) => handleCollectionOfAllowedVehicleChange(checked, 'truck')}
                            label={'Allow Trucks'}
                            type={'switch-box'}
                        />
                        <Checkbox
                            checked={props.data?.['ParkingGroup.allowedVehicleType'] === 'motorcycle'}
                            onChange={(checked) => handleCollectionOfAllowedVehicleChange(checked, 'motorcycle')}
                            label={'Allow Motorcycle'}
                            type={'switch-box'}
                        />
                        <Checkbox
                            checked={props.data?.['ParkingGroup.allowedVehicleType'] === 'bus'}
                            onChange={(checked) => handleCollectionOfAllowedVehicleChange(checked, 'bus')}
                            label={'Allow Busses'}
                            type={'switch-box'}
                        />
                        <Checkbox
                            checked={props.data?.['ParkingGroup.allowedVehicleType'] === 'bicycle'}
                            onChange={(checked) => handleCollectionOfAllowedVehicleChange(checked, 'bicycle')}
                            label={'Allow Bicycle'}
                            type={'switch-box'}
                        />

                    </ValidatableFormField>

                    <FormField className="form-field">
                        <Label>Other Options</Label>
                        {/* Smart billing capable option has not been validated here */}
                        <Checkbox
                            checked={!!props.data?.smartBillingCapable}
                            onChange={(checked) => !props.disabled && props.onValuesChange({ ...props.data, smartBillingCapable: checked })}
                            label={'Smart Billing Capable'}
                            type={'bordered'}
                        />

                        <Checkbox
                            checked={!!props.data?.['ParkingGroup.areBordersMarked']}
                            onChange={(checked) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingGroup.areBordersMarked']: checked })}
                            label={'Are Borders Marked '}
                            type={'bordered'}
                        />
                    </FormField>
                </div>
            </ValidatableForm>
        </div>
    )
});


type ParkingSpotSectionDataType = {
    'ParkingSpot.name': string,
    'ParkingSpot.address': string,
    'ParkingSpot.description': string,
    'ParkingSpot.status': ParkingSpotStatusType,
};

interface IParkingSpotSectionProps {
    data: ParkingSpotSectionDataType,
    disabled: boolean,
    uxpContext: IContextProvider,
    onValuesChange: (data: ParkingSpotSectionDataType) => void,
}

const ParkingSpotSection = React.forwardRef<ValidatableFormRef, React.PropsWithChildren<IParkingSpotSectionProps>>((props, ref) => {
    return (
        <div className="section" id="parking-spot-section">
            <h4 className="title">Parking Spot</h4>
            <div className="form-field-group">
                <ValidatableForm
                    validateSchema={{
                        'ParkingSpot.name': { fieldName: 'ParkingSpot.name', label: 'Parking spot name', validatorCollection: ['isRequired'] },
                        'ParkingSpot.status': { fieldName: 'ParkingSpot.status', label: 'Parking spot status', validatorCollection: ['isRequired'] },
                    }}
                    ref={ref}>

                    <ValidatableFormField fieldName="ParkingSpot.name" label="Spot Name *" value={props.data?.['ParkingSpot.name']}>
                        <Input
                            placeholder="Spot name"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingSpot.name']: value })}
                            value={props.data?.['ParkingSpot.name'] ?? ''}
                            isValid={props.disabled ? undefined : !!props.data?.['ParkingSpot.name']}
                            hasIndicator={!props.disabled}
                        />
                    </ValidatableFormField>

                    <FormField className="form-field">
                        <Label>Address</Label>
                        <Input
                            placeholder="Address"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ["ParkingSpot.address"]: value })}
                            value={props.data?.['ParkingSpot.address'] ?? ''}
                            isValid={props.disabled ? undefined : true}
                            hasIndicator={!props.disabled}
                        />
                    </FormField>

                    <FormField className="form-field">
                        <Label>Description</Label>
                        <Input
                            placeholder="Description"
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingSpot.description']: value })}
                            value={props.data?.['ParkingSpot.description'] ?? ''}
                            isValid={props.disabled ? undefined : true}
                            hasIndicator={!props.disabled}
                        />
                    </FormField>

                    <ValidatableFormField fieldName="ParkingSpot.status" label="Status *" value={props.data?.['ParkingSpot.status']}>
                        <Select
                            placeholder="Free, Occupied or Closed"
                            options={[
                                { label: 'Free', value: 'free' },
                                { label: 'Occupied', value: 'occupied' },
                                { label: 'Closed', value: 'closed' }
                            ]}
                            onChange={(value) => !props.disabled && props.onValuesChange({ ...props.data, ['ParkingSpot.status']: value as ParkingSpotStatusType })}
                            showEndOfContent={false}
                            selected={props.data?.['ParkingSpot.status'] ?? ''}
                            isValid={props.disabled ? undefined : !!props.data?.['ParkingSpot.status'] }
                        />
                    </ValidatableFormField>
                </ValidatableForm>
            </div>
        </div>
    )
});



export default ParkingInfomationModal