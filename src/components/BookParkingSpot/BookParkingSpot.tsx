import GeoJson from 'geojson';
import * as React from 'react'
import { Button, FormField, Label, Loading, Select, useToast } from 'uxp/components';
import { IContextProvider } from '../../uxp';
import { LatLngExpression } from 'leaflet';
import { Conditional } from '../common/ConditionalComponent';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { fetchAllParkingSites, IParkingSite } from '../ParkingInformation/ParkingSite';
import { fetchParkingGroups, IParkingGroup } from '../ParkingInformation/ParkingGroup';
import { fetchParkingSpots, findParkingSpotById, IParkingSpot } from '../ParkingInformation/ParkingSpot';
import { MapComponent, ParkingInformationContext, SelectedParkingInformation } from '../ParkingInformation/ParkingInformation'
import BreadCrumb from '../common/BreadCrumb';
import BookingDetailsModal from './BookingDetailsModal';
import SavedBookingInformationModal from './SavedBookingInformationModal';
import { hasRole } from '../../utils';
interface IParkingInformationProps { uxpContext: IContextProvider }

type ChangingParkingType = 'parkingsite' | 'parkinggroup' | 'parkingspot' | null;

const BookParkingSpot: React.VoidFunctionComponent<IParkingInformationProps> = ({ uxpContext }) => { 

    // ParkingInformation Context Props
    const [parkingSites, setParkingSites] = React.useState<IParkingSite[]>([])
    const [parkingGroups, setParkingGroups] = React.useState<IParkingGroup[]>([])
    const [parkingSpots, setParkingSpots] = React.useState<IParkingSpot[]>([])

    const [selectedParkingSiteId, setSelectedParkingSiteId] = React.useState<string>()
    const [selectedParkingGroupId, setSelectedParkingGroupId] = React.useState<string>()

    const [centerOfMap, setCenterOfMap] = React.useState<LatLngExpression>([24.467659693568866, 39.61115569920074]);
    const [zoomLevel, setZoomLevel] = React.useState<number>(12)

    const [selectedParkingInformation, setSelectedParkingInformation] = useState<SelectedParkingInformation>();

    const [showBookingDetailsModal, setShowBookingDetailsModal] = React.useState<boolean>(false);

    const history = useHistory()
    const toast = useToast();

    let [loading, setLoading] = React.useState<boolean>(true);
    let [error, setError] = React.useState<string>(null);

    let [canViewParkingSite, setCanViewParkingSite] = useState(false)
    let [canViewParkingGroup, setCanViewParkingGroup] = useState(false)
    let [canViewParkingSpot, setCanViewParkingSpot] = useState(false)


    React.useEffect(() => {
        if (!selectedParkingSiteId) return;
        const parkingSite = parkingSites.find((site) => site[`${site?.type}.id`] === selectedParkingSiteId);
        gotoPositionOfMap(parkingSite?.[`${parkingSite?.type}.location`], 22)
    }, [selectedParkingSiteId])

    React.useEffect(() => {
        if (!selectedParkingGroupId) return;

        const parkingGroup = parkingGroups.find((group) => group['ParkingGroup.id'] === selectedParkingGroupId);
        gotoPositionOfMap(parkingGroup['ParkingGroup.location'], 22)
    }, [selectedParkingGroupId])

    // Load the parking inforamtion on the initial point
    React.useEffect(() => {

        validatePermissions()

        Promise.all([
            fetchAllParkingSites(uxpContext),
            fetchParkingGroups(uxpContext),
            fetchParkingSpots(uxpContext)
        ]).then((result) => {
            const [sites, groups, spots] = result;

            setParkingSites(sites)
            setParkingGroups(groups)
            setParkingSpots(spots)

        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
            setError(err)
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const filteredParkingGroups = React.useMemo(() => {
        if (!selectedParkingSiteId) return parkingGroups;

        return parkingGroups?.filter((group) => group['ParkingGroup.refParkingSite'] === selectedParkingSiteId);
    }, [selectedParkingSiteId]);

    const validatePermissions = async () => {
        hasRole(uxpContext, 'canviewparkingsite').then(setCanViewParkingSite)
        hasRole(uxpContext, 'canviewparkinggroup').then(setCanViewParkingGroup)
        hasRole(uxpContext, 'canviewparkingspot').then(setCanViewParkingSpot)
    }


    const gotoPositionOfMap = (location: GeoJson.Point | GeoJson.Polygon, zoomLevel?: number) => {
        if (zoomLevel) {
            setZoomLevel(zoomLevel);
        }
        let geoJsonCoordinates: GeoJson.Position = null;
        if (location.type === 'Point') {
            geoJsonCoordinates = location.coordinates;
        } else {
            geoJsonCoordinates = location.coordinates[0][0];
        }

        // Swap logitute and latitude, because map expects from that format
        setCenterOfMap([geoJsonCoordinates[1], geoJsonCoordinates[0]]);
        document.getElementById('uxp-map-component-container')?.scrollIntoView({ behavior: 'smooth' });
    }

    const handleBookParkingSpotOrGroup = () => {
        setShowBookingDetailsModal(true);
    }

    const handleAfterBookingASpot = async (parkingSpot: IParkingSpot) => {
        if (!selectedParkingInformation?.entity) return;

        const newParkingSpot = await findParkingSpotById(parkingSpot['ParkingSpot.id'], uxpContext);

        setParkingSpots(parkingSpots.map(
            (spot) => spot['ParkingSpot.id'] === parkingSpot['ParkingSpot.id'] ? newParkingSpot : spot
        ))
    }

    const parkingSiteOptions = React.useMemo(() => {
        return parkingSites.map((site) => ({
            label: site?.[`${site?.type}.name`],
            value: site?.[`${site?.type}.id`],
        }))
    }, [parkingSites]);

    const parkingGroupOfSelectedParkingSpot = React.useMemo(() => {
        if (selectedParkingInformation?.type !== 'parkingspot') return null;

        const selectedParkingSpot = (selectedParkingInformation.entity as IParkingSpot);
        return parkingGroups.find((group) => group['ParkingGroup.id'] === selectedParkingSpot['ParkingSpot.refParkingGroup']);

    }, [selectedParkingInformation?.entity]);

    const parkingSiteOfSelectedParkingSpot = React.useMemo(() => {
        if (!(selectedParkingInformation?.type === 'parkingspot' || selectedParkingInformation?.type === 'parkinggroup')) return null;

        if (selectedParkingInformation?.type === 'parkingspot') {
            const selectedParkingSpot = (selectedParkingInformation.entity as IParkingSpot);
            const parkingGroup = parkingGroups.find((group) => group['ParkingGroup.id'] === selectedParkingSpot['ParkingSpot.refParkingGroup']);
            return parkingSites.find((site) => site[`${site?.type}.id`] === parkingGroup['ParkingGroup.refParkingSite'])
        }

        if (selectedParkingInformation?.type === 'parkinggroup') {
            return parkingSites.find((site) => site[`${site?.type}.id`] === (selectedParkingInformation.entity as IParkingGroup)['ParkingGroup.refParkingSite'])
        }

        return null;
    }, [selectedParkingInformation?.entity]);

    return (
        <ParkingInformationContext.Provider value={{
            parkingSites,
            parkingGroups,
            parkingSpots,
            onChangeParkingSites: (sites) => setParkingSites(sites),
            onChangeParkingGroups: (groups) => setParkingGroups(groups),
            onChangeParkingSpots: (spots) => setParkingSpots(spots),
            gotoPositionOfMap,
            zoomLevel,
            centerOfMap,
            onChangeZoomLevel: (level) => setZoomLevel(level),
            onChangeCenterOfMap: (center) => setCenterOfMap(center),
            selectedParkingInformation,
            onChangeSelectedParkingInformation: (selected) => setSelectedParkingInformation(selected),
            handleBookParkingSpotOrGroup,
            roles: {
                canViewParkingSite, canViewParkingGroup, canViewParkingSpot
            },
            hasPermissions: (type: string) => true
        }}>

            <div className='page-content'>

                <BookingDetailsModal
                    uxpContext={uxpContext}
                    show={showBookingDetailsModal}
                    onClose={() => setShowBookingDetailsModal(false)}
                    parkingSite={parkingSiteOfSelectedParkingSpot}
                    parkingGroup={selectedParkingInformation?.type === 'parkinggroup' ? selectedParkingInformation?.entity as IParkingGroup : parkingGroupOfSelectedParkingSpot}
                    parkingSpot={selectedParkingInformation?.type === 'parkingspot' ? selectedParkingInformation?.entity as IParkingSpot : null}
                    afterBookingASpot={(parkingSpot) => { handleAfterBookingASpot(parkingSpot) }}
                />

                <div className='book-parking-spot-page'>
                    <Conditional visible={loading}>
                        <div className="loading-text">
                            <span>Loading parking informations...</span>
                        </div>
                        <Loading />
                    </Conditional>
                    <Conditional visible={!!error}>
                        <Button onClick={() => { history.go(0) }} title="Refresh Page" />
                    </Conditional>

                    <Conditional visible={!error && !loading}>

                        <BreadCrumb />

                        <div className="section" id="heading-section">
                            <div className="form-field-group">

                                <FormField className="form-field">
                                    <Label>Parking Site</Label>
                                    <Select
                                        options={parkingSiteOptions}
                                        selected={selectedParkingSiteId}
                                        placeholder="Parking Site"
                                        onChange={(value) => { setSelectedParkingSiteId(value) }}
                                        isValid={!!selectedParkingSiteId}
                                    />
                                </FormField>

                                <FormField className="form-field">
                                    <Label>Parking Group</Label>
                                    <Select
                                        options={filteredParkingGroups}
                                        selected={selectedParkingGroupId}
                                        labelField="ParkingGroup.name"
                                        valueField="ParkingGroup.id"
                                        placeholder="Parking Group"
                                        onChange={(value) => { setSelectedParkingGroupId(value) }}
                                        isValid={!!selectedParkingGroupId}
                                    />
                                </FormField>

                            </div>
                        </div>


                        <div className="section" id="map-section">

                            <MapComponent
                                uxpContext={uxpContext}
                                isRedrawing={false}
                                isButtonsLoading={false}
                                hideTopButtonsPanel={true}
                                hideZoomWarning={true}
                                hideBookParkingSpotOrGroupButton={false}
                            />

                            <h4>Note : Occupied spots are marked red and free spots are marked yellow on the map</h4>

                        </div>

                    </Conditional>

                </div>
            </div>
        </ParkingInformationContext.Provider>
    )
}


export default BookParkingSpot