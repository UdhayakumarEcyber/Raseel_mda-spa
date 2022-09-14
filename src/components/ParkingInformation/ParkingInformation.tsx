import GeoJson, { Feature, MultiPoint } from 'geojson';
import * as React from 'react'
import { Button, IconButton, Input, Loading, Modal, SearchBox, Tooltip as UXPTooltip, useToast } from 'uxp/components';
import { Map, TileLayer, LayerGroup, Polygon, Tooltip, Circle } from "react-leaflet";
import { IContextProvider } from '../../uxp';
import { LatLngExpression, LatLngTuple, LeafletMouseEvent, Layer } from 'leaflet';
import "leaflet-editable";
import { Conditional } from '../common/ConditionalComponent';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { deleteParkingSite, editParkingSiteLocation, fetchAllParkingSites, findParkingSiteById, IOnStreetParkingSite, IParkingSite } from './ParkingSite';
import ParkingInformationModal, { ModalState } from './ParkingInformationModal';
import { deleteParkingGroup, editParkingGroupLocation, fetchParkingGroups, findParkingGroupById, IParkingGroup } from './ParkingGroup';
import { deleteParkingSpot, editParkingSpotLocation, fetchParkingSpots, findParkingSpotById, IParkingSpot } from './ParkingSpot';
import CollapsibleSection from '../common/CollapsibleSection';
import BreadCrumb from '../common/BreadCrumb';
import { checkIfPointIsInsidePolygon, checkIfPolygonIsInsideAnotherPolygon, hasRole } from '../../utils';
import ConfirmPopup from '../common/PopupAlert/ConfirmPopup';

import parkingSiteIcon from '../../assets/images/parking-site.svg';
import parkingGroupIcon from '../../assets/images/parking-group.svg';
import parkingSpotIcon from '../../assets/images/parking-spot.svg';
import drawIcon from '../../assets/images/draw-colorful.svg';
import cancelIcon from '../../assets/images/cancel.svg';
import editIcon from '../../assets/images/edit-colorful.svg';
import holdIcon from '../../assets/images/hold.svg';
import deleteIcon from '../../assets/images/delete-colorful.svg';
import mapIcon from '../../assets/images/map.svg';
import closeCircleOutlineIcon from '../../assets/images/close-circle-outline.svg';
import { fetchParkingOperator, IParkingOperator } from '../Devices/Properties';


export interface IParkingInformationContext {
    parkingSites: IParkingSite[];
    parkingGroups: IParkingGroup[];
    parkingSpots: IParkingSpot[];
    onChangeParkingSites?: (parkingSites: IParkingSite[]) => any;
    onChangeParkingGroups?: (parkingGroups: IParkingGroup[]) => any;
    onChangeParkingSpots?: (parkingSpots: IParkingSpot[]) => any;

    handleDeleteParkingSite?: (parkingSite: IParkingSite) => any;
    handleDeleteParkingGroup?: (parkingGrous: IParkingGroup) => any;
    handleDeleteParkingSpot?: (parkingSpot: IParkingSpot) => any;

    handleEditParkingSite?: (parkingSite: IParkingSite) => any;
    handleEditParkingGroup?: (parkingGrous: IParkingGroup) => any;
    handleEditParkingSpot?: (parkingSpot: IParkingSpot) => any;

    handleBookParkingSpotOrGroup?: (selectedParkingInformation: SelectedParkingInformation) => any;

    selectedParkingInformation: SelectedParkingInformation;
    onChangeSelectedParkingInformation?: (info: SelectedParkingInformation) => any;

    // Map Controls
    zoomLevel: number;
    centerOfMap: LatLngExpression;
    onChangeZoomLevel?: (level: number) => any;
    onChangeCenterOfMap?: (center: LatLngExpression) => any;
    gotoPositionOfMap?: (location: GeoJson.Point | GeoJson.Polygon, zoomLevel?: number) => any;

    parkingInformationTableEditable?: boolean;
    roles?: {
        canCreateParkingSite?: boolean
        canEditParkingSite?: boolean
        canDeleteParkingSite?: boolean
        canViewParkingSite?: boolean
        canCreateParkingGroup?: boolean
        canEditParkingGroup?: boolean
        canDeleteParkingGroup?: boolean
        canViewParkingGroup?: boolean
        canCreateParkingSpot?: boolean
        canEditParkingSpot?: boolean
        canDeleteParkingSpot?: boolean
        canViewParkingSpot?: boolean
    },
    hasPermissions?: (type: string) => boolean
}

export const ParkingInformationContext = React.createContext<IParkingInformationContext>({
    parkingSites: [],
    parkingGroups: [],
    parkingSpots: [],
    zoomLevel: 16,
    centerOfMap: [24.5247, 39.5692],
    selectedParkingInformation: null,
    roles: {
        canCreateParkingSite: false,
        canEditParkingSite: false,
        canDeleteParkingSite: false,
        canViewParkingSite: false,
        canCreateParkingGroup: false,
        canEditParkingGroup: false,
        canDeleteParkingGroup: false,
        canViewParkingGroup: false,
        canCreateParkingSpot: false,
        canEditParkingSpot: false,
        canDeleteParkingSpot: false,
        canViewParkingSpot: false
    }
});

interface IParkingInformationProps { uxpContext: IContextProvider }

type ChangingParkingType = 'parkingsite' | 'parkinggroup' | 'parkingspot' | null;

const ParkingInformation: React.VoidFunctionComponent<IParkingInformationProps> = ({ uxpContext }) => {

    // ParkingInformation Context Props
    const [parkingSites, setParkingSites] = React.useState<IParkingSite[]>([]);
    const [parkingGroups, setParkingGroups] = React.useState<IParkingGroup[]>([]);
    const [parkingSpots, setParkingSpots] = React.useState<IParkingSpot[]>([]);

    const [parkingOperators, setParkingOperators] = React.useState<IParkingOperator[]>([]);

    const [zoomLevel, setZoomLevel] = React.useState<number>(12);
    const [centerOfMap, setCenterOfMap] = React.useState<LatLngExpression>([24.467659693568866, 39.61115569920074]);

    const [selectedParkingInformation, setSelectedParkingInformation] = useState<SelectedParkingInformation>();

    const history = useHistory()
    const toast = useToast();

    const mapComponentRef = React.useRef<MapComponentRef>()

    let [loading, setLoading] = React.useState<boolean>(true);
    let [error, setError] = React.useState<string>(null);

    let [isViewDetailsSectionExpanded, setIsViewDetailsSectionExpanded] = React.useState<boolean>(false)

    let [showModal, setShowModal] = React.useState<boolean>(false)
    // Which parking information is being edited now
    let [editingInfo, setEditingInfo] = React.useState<IParkingSite | IParkingGroup | IParkingSpot>();
    // Represents what we are drawing right now
    let [changingParkingType, setChangingParkingType] = React.useState<ChangingParkingType>();
    // Represents modal state
    let [modalState, setModalState] = React.useState<ModalState>('view');

    let [parentParkingSiteOfModal, setParentParkingSiteOfModal] = React.useState<IParkingSite>();
    let [parentParkingGroupOfModal, setParentParkingGroupOfModal] = React.useState<IParkingGroup>();

    // Represents the current location that was drawn in the map
    let [location, setLocation] = React.useState<GeoJson.Polygon | GeoJson.Point>()
    let [drawingType, setDrawingType] = React.useState<'polygon' | 'marker'>()
    let [isButtonsOnMapLoading, setIsButtonsOnMapLoading] = React.useState<boolean>(false)
    let [isRedrawingOnMap, setIsRedrawingOnMap] = React.useState<boolean>(false)

    let [search, setSearch] = React.useState<string>('')

    let [deletingSite, setDeletingSite] = React.useState(null)
    let [deletingGroup, setDeletingGroup] = React.useState(null)
    let [deletingSpot, setDeletingSpot] = React.useState(null)
    let [editingSpot, setEditinSpot] = React.useState(null)


    let [canCreateParkingSite, setCanCreateParkingSite] = useState(false)
    let [canEditParkingSite, setCanEditParkingSite] = useState(false)
    let [canDeleteParkingSite, setCanDeleteParkingSite] = useState(false)
    let [canViewParkingSite, setCanViewParkingSite] = useState(false)

    let [canCreateParkingGroup, setCanCreateParkingGroup] = useState(false)
    let [canEditParkingGroup, setCanEditParkingGroup] = useState(false)
    let [canDeleteParkingGroup, setCanDeleteParkingGroup] = useState(false)
    let [canViewParkingGroup, setCanViewParkingGroup] = useState(false)

    let [canCreateParkingSpot, setCanCreateParkingSpot] = useState(false)
    let [canEditParkingSpot, setCanEditParkingSpot] = useState(false)
    let [canDeleteParkingSpot, setCanDeleteParkingSpot] = useState(false)
    let [canViewParkingSpot, setCanViewParkingSpot] = useState(false)

    React.useEffect(() => {
        validatePermissions()
    }, [])

    async function getCurrentUserDetails() {
        const data = await uxpContext.getUserDetails() as any;
        try {
            let userGroup = data?.userGroupName?.toLowerCase() || null
            let userKey = uxpContext.userKey

            return { userGroupName: userGroup, userKey }
        } catch (error) {
            console.error(error);
        }
    }


    // Load the parking inforamtion on the initial point
    React.useEffect(() => {

        Promise.all([
            fetchAllParkingSites(uxpContext),
            fetchParkingGroups(uxpContext),
            fetchParkingSpots(uxpContext),
            fetchParkingOperator(uxpContext),
            getCurrentUserDetails()
        ]).then((result) => {
            const [sites, groups, spots, operators, userDetails] = result;

            if (userDetails.userGroupName === 'po administrator') {
                setParkingSites(sites?.filter((site) =>
                    !!operators.find((operator) => operator.refAdministrator === userDetails.userKey && site.refParkingOperator === operator._id)))
            } if (userDetails.userGroupName === 'po moderator') {
                setParkingSites(sites?.filter((site) =>
                    !!operators.find((operator) => operator.refModerator === userDetails.userKey && site.refParkingOperator === operator._id)))
            } else {
                setParkingSites(sites)
            }

            setParkingGroups(groups)
            setParkingSpots(spots)
            setParkingOperators(operators)

            console.log('USER_DETAILS', userDetails)
        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
            setError(err)
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const validatePermissions = async () => {
        hasRole(uxpContext, 'cancreateparkingsite').then(setCanCreateParkingSite)
        hasRole(uxpContext, 'canupdateparkingsite').then(setCanEditParkingSite)
        hasRole(uxpContext, 'candeleteparkingsite').then(setCanDeleteParkingSite)
        hasRole(uxpContext, 'canviewparkingsite').then(setCanViewParkingSite)

        hasRole(uxpContext, 'cancreateparkinggroup').then(setCanCreateParkingGroup)
        hasRole(uxpContext, 'canupdateparkinggroup').then(setCanEditParkingGroup)
        hasRole(uxpContext, 'candeleteparkinggroup').then(setCanDeleteParkingGroup)
        hasRole(uxpContext, 'canviewparkinggroup').then(setCanViewParkingGroup)

        hasRole(uxpContext, 'cancreateparkingspot').then(setCanCreateParkingSpot)
        hasRole(uxpContext, 'canupdateparkingspot').then(setCanEditParkingSpot)
        hasRole(uxpContext, 'candeleteparkingspot').then(setCanDeleteParkingSpot)
        hasRole(uxpContext, 'canviewparkingspot').then(setCanViewParkingSpot)
    }

    function hasPermissions(type: string) {

        // get selected type 
        let selType = selectedParkingInformation?.type || null

        switch (selType) {
            case "parkingsite":
                if (type == "create") return canCreateParkingGroup
                if (type == "edit") return canEditParkingSite
                if (type == "delete") return canDeleteParkingSite
                break
            case "parkinggroup":
                if (type == "create") return canCreateParkingSpot
                if (type == "edit") return canEditParkingGroup
                if (type == "delete") return canDeleteParkingGroup
                break
            case "parkingspot":
                if (type == "edit") return canEditParkingSpot
                if (type == "delete") return canDeleteParkingSpot
                break
            default:
                if (type == "create") return canCreateParkingSite
        }

        return true
    }

    const handleDrawParkingSiteButtonClick = () => {
        if (changingParkingType !== 'parkingsite') {
            // Start drawing parking site
            setDrawingType('polygon')
            setChangingParkingType('parkingsite');
        } else {
            // Stop drawing parking site and show the modal please
            setDrawingType(null)
            setModalState('create');
            setShowModal(true);
        }
    }

    const handleDrawParkingGroupButtonClick = (location: GeoJson.Polygon | GeoJson.Point) => {
        if (changingParkingType !== 'parkinggroup') {
            // Start drawing parking group
            setDrawingType('polygon')
            setChangingParkingType('parkinggroup');
        } else {
            // Stop drawing parking group and show the modal please
            setDrawingType(null)
            setEditingInfo(null);

            const selectedParkingSite = selectedParkingInformation?.entity as IParkingSite;

            if (checkIfPolygonIsInsideAnotherPolygon(location as GeoJson.Polygon, selectedParkingSite?.[`${selectedParkingSite?.type}.location`])) {
                setModalState('create');
                setParentParkingSiteOfModal(selectedParkingSite)
                setShowModal(true);
            } else {
                toast.error('Drawn parking group is outside of its parking group')
                setLocation(null);
                mapComponentRef.current?.clearTheDrawnAreasOfMap();

                setChangingParkingType(null);
            }

        }
    }

    const handleDrawParkingSpotButtonClick = () => {
        if (changingParkingType !== 'parkingspot') {
            // Start drawing parking spot
            setDrawingType('marker')
            setChangingParkingType('parkingspot');
        }
    }

    const handleSavingParkingInformation = (parkingInformation: IParkingSpot | IParkingSite | IParkingGroup) => {
        const modalState = !!editingInfo ? 'editing' : 'creating';

        if (modalState === 'creating') {
            switch (changingParkingType) {
                case 'parkingsite':
                    setParkingSites([parkingInformation as IParkingSite, ...parkingSites])
                    break;

                case 'parkinggroup':
                    setParkingGroups([parkingInformation as IParkingGroup, ...parkingGroups])
                    break;

                case 'parkingspot':
                    setParkingSpots([parkingInformation as IParkingSpot, ...parkingSpots])
                    break;
            }
        } else {
            switch (changingParkingType) {
                case 'parkingsite':
                    const parkingSite = parkingInformation as IParkingSite;
                    setParkingSites(parkingSites.map(
                        (site) => (site?.type === parkingSite?.type && site?.[`${site?.type}.id`] === parkingSite?.[`${parkingSite?.type}.id`]) ? parkingSite : site
                    ))
                    break;

                case 'parkinggroup':
                    const parkingGroup = parkingInformation as IParkingGroup;
                    setParkingGroups(parkingGroups.map(
                        (group) => group['ParkingGroup.id'] === parkingGroup['ParkingGroup.id'] ? parkingGroup : group
                    ))
                    break;

                case 'parkingspot':
                    const parkingSpot = parkingInformation as IParkingSpot;
                    setParkingSpots(parkingSpots.map(
                        (spot) => spot['ParkingSpot.id'] === parkingSpot['ParkingSpot.id'] ? parkingSpot : spot
                    ))
                    break;
            }
        }
        setIsViewDetailsSectionExpanded(true);
        handleOnCloseOfModal();
    }

    const handleOnCloseOfModal = () => {
        setEditingInfo(null);
        setLocation(null);
        mapComponentRef.current?.clearTheDrawnAreasOfMap();
        setChangingParkingType(null);
        setShowModal(false);
    }

    const handleOnSaveRedrawnLocation = async (location: GeoJson.Polygon | GeoJson.Point) => {
        if (!selectedParkingInformation) return;

        setIsButtonsOnMapLoading(true);
        try {
            await (async () => {
                if (selectedParkingInformation?.type === 'parkingsite') {
                    const selectedParkingSite = selectedParkingInformation?.entity as IParkingSite;

                    await editParkingSiteLocation(selectedParkingSite?.[`${selectedParkingSite?.type}.id`], location, selectedParkingSite?.type, uxpContext)

                    const newParkingSite = await findParkingSiteById(selectedParkingSite?.[`${selectedParkingSite?.type}.id`], selectedParkingSite?.type, uxpContext);

                    // Modify new parking site with old parking site
                    setParkingSites(
                        parkingSites.map((site) => {
                            return (site?.type === selectedParkingSite?.type && site?.[`${site?.type}.id`] === selectedParkingSite?.[`${selectedParkingSite?.type}.id`])
                                ? newParkingSite : site;
                        })
                    )
                } else if (selectedParkingInformation?.type === 'parkinggroup') {
                    const selectedParkingGroup = selectedParkingInformation?.entity as IParkingGroup;

                    const parkingSite = parkingSites.find((site) => site?.[`${site?.type}.id`] === selectedParkingGroup['ParkingGroup.refParkingSite'])

                    if (checkIfPolygonIsInsideAnotherPolygon(location as GeoJson.Polygon, parkingSite?.[`${parkingSite?.type}.location`])) {
                        await editParkingGroupLocation(selectedParkingGroup['ParkingGroup.id'], location, uxpContext);

                        const newParkingGroup = await findParkingGroupById(selectedParkingGroup['ParkingGroup.id'], uxpContext);

                        // Modify new parking group with old parking group
                        setParkingGroups(
                            parkingGroups.map((group) => (selectedParkingGroup['ParkingGroup.id'] === group['ParkingGroup.id'] ? newParkingGroup : group))
                        )
                    } else {
                        toast.error('Drawn parking group is outside of its parking group')
                    }

                } else if (selectedParkingInformation?.type === 'parkingspot') {
                    const selectedParkingSpot = selectedParkingInformation?.entity as IParkingSpot;

                    const parkingGroup = parkingGroups.find((group) => group['ParkingGroup.id'] === selectedParkingSpot['ParkingSpot.refParkingGroup'])

                    if (checkIfPointIsInsidePolygon(location as GeoJson.Point, parkingGroup['ParkingGroup.location'])) {

                        await editParkingSpotLocation(selectedParkingSpot['ParkingSpot.id'], location, uxpContext);

                        const newParkingSpot = await findParkingSpotById(selectedParkingSpot['ParkingSpot.id'], uxpContext);

                        // Modify new parking spot with old parking spot
                        setParkingSpots(
                            parkingSpots.map((spot) => (selectedParkingSpot['ParkingSpot.id'] === spot['ParkingSpot.id'] ? newParkingSpot : spot))
                        )
                    } else {
                        toast.error('Drawn parking spot is outside of its parking group')
                    }
                }
            })()

        } catch (error) {
            toast.error('Something went wrong while saving the location....');
        } finally {
            setIsRedrawingOnMap(false);
            setLocation(null);
            mapComponentRef.current?.clearTheDrawnAreasOfMap();
            setIsButtonsOnMapLoading(false);
            setChangingParkingType(null);
            setDrawingType(null);
        }
    }


    React.useEffect(() => {
        if (!location) return;

        // If user has drawn a parking spot 
        if (changingParkingType === 'parkingspot' && drawingType === 'marker') {
            if (isRedrawingOnMap) {
                setEditinSpot(location)
                // if (!confirm('Do you really want to change this spot\'s location?')) return;
                // setIsRedrawingOnMap(false);
                // handleOnSaveRedrawnLocation(location)
                return;
            }

            setDrawingType(null);
            setEditingInfo(null);

            const selectedParkingGroup = selectedParkingInformation?.entity as IParkingGroup;

            if (!checkIfPointIsInsidePolygon(location as GeoJson.Point, selectedParkingGroup?.['ParkingGroup.location'])) {
                setLocation(null);
                mapComponentRef.current?.clearTheDrawnAreasOfMap();

                setChangingParkingType(null)
                return toast.error('Drawn parking spot is outside of its parking group')
            }

            setModalState('create');
            setParentParkingGroupOfModal(selectedParkingGroup)
            setShowModal(true);
        }
    }, [location])

    const onEditingSpot = async () => {
        return new Promise((done, nope) => {
            setIsRedrawingOnMap(false);
            handleOnSaveRedrawnLocation(location)
            setEditinSpot(null)
            done("updated")

        })
    }

    const handleDeleteParkingSpot = async (deletingSpot: IParkingSpot) => { setDeletingSpot(deletingSpot) }
    const onDeleteParkingSpot = async (deletingSpot: IParkingSpot) => {
        try {
            setIsButtonsOnMapLoading(true);

            await deleteParkingSpot(deletingSpot['ParkingSpot.id'], uxpContext);

            setParkingSpots(parkingSpots.filter((spot) => spot['ParkingSpot.id'] !== deletingSpot['ParkingSpot.id']))
            toast.success(`${deletingSpot['ParkingSpot.name']} spot was deleted successfully`)
            setSelectedParkingInformation(null);
        } catch (err) {
            try {
                err = JSON.parse(err);

                if (!!err.code && !!err.message) {
                    if (err.code == 101502 && err.message == 'ERR_PARKING_SPOT_IN_USE') {
                        toast.error('Unable to delete parking spot. Spot in use');
    
                        return;
                    }
                }
            } catch (error) {
                
            }

            toast.error('Something went wrong while deleting parking spot...');
        } finally {
            setIsButtonsOnMapLoading(false);
            setDeletingSpot(null)
        }
    }

    const handleDeleteParkingGroup = async (deletingGroup: IParkingGroup) => { setDeletingGroup(deletingGroup) }
    const onDeleteParkingGroup = async (deletingGroup: IParkingGroup) => {
        try {
            setIsButtonsOnMapLoading(true);

            await deleteParkingGroup(deletingGroup['ParkingGroup.id'], uxpContext);

            setParkingGroups(parkingGroups.filter((group) => group['ParkingGroup.id'] !== deletingGroup['ParkingGroup.id']));
            setParkingSpots(parkingSpots.filter((spot) => spot['ParkingSpot.refParkingGroup'] !== deletingGroup['ParkingGroup.id']));

            setSelectedParkingInformation(null);
            toast.success(`${deletingGroup['ParkingGroup.name']} group was deleted successfully`)
        } catch (err) {
            try {
                err = JSON.parse(err);

                if (!!err.code && !!err.message) {
                    if (err.code == 101402 && err.message == 'ERR_PARKING_GROUP_IN_USE') {
                        toast.error('Unable to delete parking group. Group in use');
    
                        return;
                    }
                }
            } catch (error) {
                
            }

            toast.error('Something went wrong while deleting parking group...');
        } finally {
            setIsButtonsOnMapLoading(false);
            setDeletingGroup(null)
        }
    }

    const handleDeleteParkingSite = async (deletingSite: IParkingSite) => {
        setDeletingSite(deletingSite)
    }
    const onDeleteParkingSite = async (deletingSite: IParkingSite) => {
        try {
            setIsButtonsOnMapLoading(true);
            await deleteParkingSite(deletingSite?.[`${deletingSite?.type}.id`], deletingSite?.type, uxpContext);

            const parkingGroupsOfSite = parkingGroups.filter((group) => group['ParkingGroup.refParkingSite'] === deletingSite?.[`${deletingSite?.type}.id`])
            const parkingSpotsOfSite = parkingSpots.filter((spot) => parkingGroupsOfSite.find((group) => group['ParkingGroup.id'] === spot['ParkingSpot.refParkingGroup']));

            setParkingSpots(parkingSpots.filter((spot) => !parkingSpotsOfSite.find((parkingSpotOfThisSite) => parkingSpotOfThisSite['ParkingSpot.id'] === spot['ParkingSpot.id'])))
            setParkingGroups(parkingGroups.filter((group) => group['ParkingGroup.refParkingSite'] !== deletingSite?.[`${deletingSite?.type}.id`]));

            setParkingSites(parkingSites.filter((site) => !(site?.type === deletingSite?.type && site?.[`${site?.type}.id`] === deletingSite?.[`${deletingSite?.type}.id`])))

            setSelectedParkingInformation({
                type: null,
                entity: null
            });
            toast.success(`${deletingSite?.[`${deletingSite?.type}.name`]} site was deleted successfully`)
        } catch (err) {
            try {
                err = JSON.parse(err);

                if (!!err.code && !!err.message) {
                    if (err.code == 103802 && err.message == 'ERR_PARKING_SITE_IN_USE') {
                        toast.error('Unable to delete parking site. Site in use');
    
                        return;
                    }
                }
            } catch (error) {
                
            }
            
            toast.error('Something went wrong while deleting parking site...');
        } finally {
            setIsButtonsOnMapLoading(false);
            setDeletingSite(null)
        }
    }

    const handleEditParkingInformation = async (
        editingInfo: IParkingGroup | IParkingSite | IParkingSpot,
        type: ChangingParkingType
    ) => {
        setChangingParkingType(type);
        setModalState('edit');
        setEditingInfo(editingInfo);
        setShowModal(true);
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

    const handleOnCancelDrawParkingInformationButtonClick = () => {
        setIsRedrawingOnMap(false);
        setLocation(null);
        mapComponentRef.current?.clearTheDrawnAreasOfMap();
        setIsButtonsOnMapLoading(false);
        setChangingParkingType(null);
        setDrawingType(null);
    }

    // Expand the view details section on select a parking information
    React.useEffect(() => {
        if(!selectedParkingInformation?.entity) return;

        setIsViewDetailsSectionExpanded(true)
     }, [selectedParkingInformation?.entity])

    return (
        <ParkingInformationContext.Provider value={{
            parkingSites,
            parkingGroups,
            parkingSpots,
            onChangeParkingSites: (sites) => setParkingSites(sites),
            onChangeParkingGroups: (groups) => setParkingGroups(groups),
            onChangeParkingSpots: (spots) => setParkingSpots(spots),
            handleDeleteParkingSpot: (spot) => { handleDeleteParkingSpot(spot) },
            handleDeleteParkingGroup: (group) => { handleDeleteParkingGroup(group) },
            handleDeleteParkingSite: (site) => { handleDeleteParkingSite(site) },
            handleEditParkingSpot: (spot) => { handleEditParkingInformation(spot, 'parkingspot') },
            handleEditParkingGroup: (group) => { handleEditParkingInformation(group, 'parkinggroup') },
            handleEditParkingSite: (site) => { handleEditParkingInformation(site, 'parkingsite') },
            gotoPositionOfMap,
            zoomLevel,
            centerOfMap,
            onChangeZoomLevel: (level) => setZoomLevel(level),
            onChangeCenterOfMap: (center) => setCenterOfMap(center),
            selectedParkingInformation: selectedParkingInformation,
            onChangeSelectedParkingInformation: (selected) => setSelectedParkingInformation(selected),
            parkingInformationTableEditable: true,
            roles: {
                canCreateParkingSite,
                canEditParkingSite,
                canDeleteParkingSite,
                canViewParkingSite,
                canCreateParkingGroup,
                canEditParkingGroup,
                canDeleteParkingGroup,
                canViewParkingGroup,
                canCreateParkingSpot,
                canEditParkingSpot,
                canDeleteParkingSpot,
                canViewParkingSpot
            },
            hasPermissions: hasPermissions
        }}>
            <ParkingInformationModal
                uxpContext={uxpContext}
                show={showModal}
                parkingInformation={editingInfo}
                parkingInformationType={changingParkingType}
                location={location}
                modalState={modalState}
                onClose={handleOnCloseOfModal}
                afterSave={handleSavingParkingInformation}
                parentParkingSite={parentParkingSiteOfModal}
                parentParkingGroup={parentParkingGroupOfModal}
            />

            <div className='page-content'>
                <div className='parking-information-page'>
                    <BreadCrumb />
                    <Conditional visible={loading}>
                        <div className="loading-text">
                            <span>Loading parking informations</span>
                        </div>
                        <Loading />
                    </Conditional>
                    <Conditional visible={!!error}>
                        <Button onClick={() => { history.go(0) }} title="Refresh Page" />
                    </Conditional>

                    <Conditional visible={!error && !loading}>
                        <div style={{ visibility: isRedrawingOnMap ? 'hidden' : 'visible' }} className="map-control-panel">

                            <Conditional visible={canCreateParkingSite} >
                                <Button
                                    disabled={false}
                                    active={changingParkingType === 'parkingsite'}
                                    className="map-control"
                                    icon={parkingSiteIcon}
                                    title={changingParkingType === 'parkingsite' ? "Stop Drawing Parking Site & Save" : "Draw Parking Site"}
                                    onClick={handleDrawParkingSiteButtonClick} />
                            </Conditional>
                            <Conditional visible={changingParkingType === 'parkingsite'}>
                                <Button
                                    disabled={false}
                                    active={changingParkingType === 'parkingsite'}
                                    className="map-control"
                                    icon={cancelIcon}
                                    title={"Cancel Drawing"}
                                    onClick={handleOnCancelDrawParkingInformationButtonClick} />
                            </Conditional>
                        </div>

                        <MapComponent
                            uxpContext={uxpContext}
                            location={location}
                            ref={mapComponentRef}
                            onLocationChange={(location) => { setLocation(location) }}
                            drawingType={drawingType}
                            onChangeIsRedrawing={(isRedrawing) => setIsRedrawingOnMap(isRedrawing)}
                            onChangeDrawingType={(type) => { setDrawingType(type) }}
                            changingParkingType={changingParkingType}
                            onChangeChangingParkingType={(changingType) => { setChangingParkingType(changingType) }}
                            isButtonsLoading={isButtonsOnMapLoading}
                            isRedrawing={isRedrawingOnMap}
                            onSaveRedrawnLocation={async (location) => {
                                await handleOnSaveRedrawnLocation(location)
                            }}
                            hideBookParkingSpotOrGroupButton={true}
                            handleDrawParkingGroupButtonClick={handleDrawParkingGroupButtonClick}
                            handleDrawParkingSpotButtonClick={handleDrawParkingSpotButtonClick}
                            handleOnCancelDrawParkingInformationButtonClick={handleOnCancelDrawParkingInformationButtonClick}
                        />

                        <CollapsibleSection
                            title="View Parking Information"
                            isExpanded={isViewDetailsSectionExpanded}
                            onChange={(v) => setIsViewDetailsSectionExpanded(v)}
                            sidebarChildren={
                                <SearchBox
                                    value={search}
                                    placeholder="Search Parking Sites"
                                    onChange={(value) => setSearch(value)}
                                />
                            }
                        >
                            <div className="parking-information-table-wrapper">
                                <ParkingInformationTable search={search} />
                            </div>
                        </CollapsibleSection>
                    </Conditional>
                </div>
            </div>


            <ConfirmPopup
                show={deletingSite !== null}
                onConfirm={{
                    execute: () => onDeleteParkingSite(deletingSite),
                    onComplete: () => {
                    },
                    onError: (e) => {
                    }
                }}
                onCancel={() => setDeletingSite(null)}
                message={`Are you sure. You want to delete this parking site?`}
                processingMessage={`Deleting parking site...`}
            />

            <ConfirmPopup
                show={deletingGroup !== null}
                onConfirm={{
                    execute: () => onDeleteParkingGroup(deletingGroup),
                    onComplete: () => {
                    },
                    onError: (e) => {
                    }
                }}
                onCancel={() => setDeletingGroup(null)}
                message={`Are you sure. You want to delete this parking group?`}
                processingMessage={`Deleting parking group...`}
            />

            <ConfirmPopup
                show={deletingSpot !== null}
                onConfirm={{
                    execute: () => onDeleteParkingSpot(deletingSpot),
                    onComplete: () => {
                    },
                    onError: (e) => {
                    }
                }}
                onCancel={() => setDeletingSpot(null)}
                message={`Are you sure. You want to delete this parking spot?`}
                processingMessage={`Deleting parking spot...`}
            />

            <ConfirmPopup
                show={editingSpot !== null}
                onConfirm={{
                    execute: () => onEditingSpot(),
                    onComplete: () => {
                    },
                    onError: (e) => {
                    }
                }}
                onCancel={() => {
                    setEditinSpot(null)
                    setIsRedrawingOnMap(false)
                    handleOnCancelDrawParkingInformationButtonClick()
                }}
                message={`Do you really want to change this spot\'s location?`}
                processingMessage={`Updating parking spot...`}
            />

        </ParkingInformationContext.Provider>
    )
}

export interface IMapComponentProps {
    uxpContext: IContextProvider;
    location?: GeoJson.Polygon | GeoJson.Point;
    isButtonsLoading: boolean;
    isRedrawing: boolean;
    onChangeIsRedrawing?: (isRedrawing: boolean) => any;
    drawingType?: 'polygon' | 'marker';
    onChangeDrawingType?: (type: 'polygon' | 'marker') => any;
    onLocationChange?: (location: GeoJson.Polygon | GeoJson.Point) => any;
    onSaveRedrawnLocation?: (location: GeoJson.Polygon | GeoJson.Point) => Promise<any> | any;
    changingParkingType?: ChangingParkingType,
    onChangeChangingParkingType?: (type: ChangingParkingType) => any;
    hideTopButtonsPanel?: boolean;
    hideZoomWarning?: boolean;
    hideBookParkingSpotOrGroupButton?: boolean;
    handleDrawParkingGroupButtonClick?: (location: GeoJson.Polygon | GeoJson.Point) => any;
    handleDrawParkingSpotButtonClick?: (location: GeoJson.Polygon | GeoJson.Point) => any;
    handleOnCancelDrawParkingInformationButtonClick?: () => any;
}

export interface SelectedParkingInformation {
    entity: IParkingGroup | IParkingSite | IParkingSpot;
    type: ChangingParkingType;
}

export type MapComponentRef = {
    clearTheDrawnAreasOfMap: () => any
};

export const MapComponent = React.forwardRef<MapComponentRef, React.PropsWithChildren<IMapComponentProps>>((props, ref) => {
    let [editingLocation, setEditingLocation] = React.useState(false)

    const {
        zoomLevel,
        centerOfMap,
        parkingSites,
        parkingGroups,
        parkingSpots,
        onChangeZoomLevel,
        onChangeCenterOfMap,
        selectedParkingInformation,
        onChangeSelectedParkingInformation,
        handleDeleteParkingGroup,
        handleDeleteParkingSite,
        handleDeleteParkingSpot,
        handleEditParkingGroup,
        handleEditParkingSite,
        handleEditParkingSpot,
        handleBookParkingSpotOrGroup,
        roles: {
            canCreateParkingSite,
            canEditParkingSite,
            canDeleteParkingSite,
            canViewParkingSite,
            canCreateParkingGroup,
            canEditParkingGroup,
            canDeleteParkingGroup,
            canViewParkingGroup,
            canCreateParkingSpot,
            canEditParkingSpot,
            canDeleteParkingSpot,
            canViewParkingSpot
        },
        hasPermissions
    } = React.useContext(ParkingInformationContext);

    React.useEffect(() => {
        const handler = (e: any) => {
            drawnLayer.current = e.layer;
            props.onLocationChange(e.layer.toGeoJSON().geometry);
        }

        mapRef.current.leafletElement.on('editable:drawing:end', handler);
    }, []);



    React.useEffect(() => {

        let editingStrokeColor: string = null;

        switch (props.changingParkingType) {
            case 'parkingsite': editingStrokeColor = '#3388ff'; break;
            case 'parkinggroup': editingStrokeColor = '#41d551'; break;
            case 'parkingspot': editingStrokeColor = '#ff00f1'; break;
            default: editingStrokeColor = '#3388ff'; break;
        }

        // Change stroke color
        const handler = (e: any) => {
            e.layer.setStyle({ color: editingStrokeColor });
        }

        mapRef.current.leafletElement.off('editable:editing')
        mapRef.current.leafletElement.on('editable:editing', handler);
    }, [props.changingParkingType]);

    // Holds the map DOM element
    const mapRef = React.useRef<Map>();

    const drawnLayer = React.useRef<Layer>();

    const clearTheDrawnAreasOfMap = () => {
        if (!mapRef.current?.leafletElement) return;
        try {
            (mapRef.current.leafletElement?.editTools as any)?.featuresLayer.clearLayers()
        } catch (error) {
            console.error(error)
        }

    }
    React.useImperativeHandle(ref, () => ({
        clearTheDrawnAreasOfMap
    }), [])


    React.useEffect(() => {

        if (!props.location) {
            clearTheDrawnAreasOfMap()
        }
    }, [props.location])

    React.useEffect(() => {
        if (!mapRef.current || !mapRef.current.leafletElement) return;

        if (props.drawingType === 'polygon') {
            console.log('Started drawing a polygon...')
            mapRef.current.leafletElement.editTools.startPolygon();
        } else if (props.drawingType === 'marker') {
            console.log('Started drawing a marker...')
            mapRef.current.leafletElement.editTools.startMarker();
        } else {
            mapRef.current.leafletElement.editTools.stopDrawing();
        }
    }, [props.drawingType]);

    const getDrawnLocationFromMap = (): GeoJSON.Point | GeoJson.Polygon => {
        const featuresGEOJsonCollection = (mapRef.current?.leafletElement.editTools as any)?.featuresLayer.toGeoJSON().features;
        if (featuresGEOJsonCollection?.length === 0) return null;

        return featuresGEOJsonCollection[featuresGEOJsonCollection.length - 1]?.geometry;

    }


    const onEditingLocation = async () => {
        return new Promise(async (done, nope) => {

            const redrawnLocation = getDrawnLocationFromMap()
            if (!redrawnLocation) return;

            props.onChangeDrawingType(null);
            await props.onSaveRedrawnLocation(redrawnLocation);
            props.onChangeIsRedrawing(false);
            setEditingLocation(false)
            done("done")
        })
    }

    return (
        <div style={{ position: 'relative' }}>
            <div className="map-control-edit-button-container">

                {/* Here we've taken 'book parking spot' button isn't belongs to top panel. Occasional change...  */}
                <Conditional
                    visible={!props.hideBookParkingSpotOrGroupButton &&
                        (selectedParkingInformation?.type === 'parkingspot' || selectedParkingInformation?.type === 'parkinggroup')
                    }>
                    <Button
                        loading={props.isButtonsLoading}
                        className="map-control-button booking-button"
                        icon={holdIcon}
                        title={selectedParkingInformation?.type === 'parkingspot' ? "Book Selected Parking Spot" : "Book An Available Spot Of Selected Parking Group"}
                        onClick={() => handleBookParkingSpotOrGroup(selectedParkingInformation)}
                    />
                </Conditional>

                <Conditional visible={!props.hideTopButtonsPanel && !!selectedParkingInformation?.type}>
                    <Conditional visible={!props.isRedrawing && !props.changingParkingType}>
                        <Button
                            className="map-control-button draw-parking-info-button"
                            icon={closeCircleOutlineIcon}
                            title={"Unselect"}
                            onClick={() => onChangeSelectedParkingInformation(null)} />
                    </Conditional>
                        
                    <Conditional visible={!!props.changingParkingType}>
                        <Button
                            active={props.changingParkingType === 'parkinggroup'}
                            className="map-control-button draw-parking-info-button"
                            icon={cancelIcon}
                            title={props.isRedrawing ? "Cancel Redrawing" : "Cancel Drawing"}
                            onClick={() => props.handleOnCancelDrawParkingInformationButtonClick()} />
                    </Conditional>

                    <Conditional visible={selectedParkingInformation?.type === 'parkingsite' && !props.isRedrawing && hasPermissions("create")}>
                        <Button
                            disabled={false}
                            active={props.changingParkingType === 'parkinggroup'}
                            className="map-control-button draw-parking-info-button"
                            icon={parkingGroupIcon}
                            title={props.changingParkingType === 'parkinggroup' ? "Stop Drawing Parking Group & Save" : "Draw Parking Group"}
                            onClick={() => props.handleDrawParkingGroupButtonClick(getDrawnLocationFromMap())} />
                    </Conditional>

                    <Conditional visible={selectedParkingInformation?.type === 'parkinggroup' && !props.isRedrawing && hasPermissions("create")}>
                        <Button
                            disabled={false}
                            active={props.changingParkingType === 'parkingspot'}
                            className="map-control-button draw-parking-info-button"
                            icon={parkingSpotIcon}
                            title={props.changingParkingType === 'parkingspot' ? "Click on the map to draw parking spot" : "Draw Parking Spot"}
                            onClick={() => props.handleDrawParkingSpotButtonClick(getDrawnLocationFromMap())} />
                    </Conditional>

                    <Conditional visible={hasPermissions("edit")}>
                        <UXPTooltip content={props.isRedrawing ? "Stop Redrawing & Save" : 'Redraw On Map'} position="bottom">
                            <Button
                                loading={props.isButtonsLoading}
                                className="map-control-button"
                                title={props.isRedrawing ? "Stop Redrawing & Save" : ''}
                                icon={drawIcon}
                                onClick={async () => {
                                    if (props.isRedrawing) {
                                        mapRef.current?.leafletElement.editTools.stopDrawing();
                                        props.onChangeDrawingType(null);

                                        setEditingLocation(true)
                                        // const v = confirm('Do you really want to change the shape ?');
                                        // if (v) {
                                        //     const redrawnLocation = getDrawnLocationFromMap()
                                        //     if (!redrawnLocation) return;

                                        //     props.onChangeDrawingType(null);
                                        //     await props.onSaveRedrawnLocation(redrawnLocation);
                                        // } else {
                                        //     clearTheDrawnAreasOfMap()
                                        // }

                                        // props.onChangeIsRedrawing(false);
                                    } else {

                                        if (!selectedParkingInformation) return;

                                        if (!mapRef.current || !mapRef.current.leafletElement) return;

                                        props.onChangeChangingParkingType(selectedParkingInformation?.type)
                                        if (selectedParkingInformation?.type === 'parkinggroup' || selectedParkingInformation?.type === 'parkingsite') {
                                            props.onChangeDrawingType('polygon');
                                        } else if (selectedParkingInformation?.type === 'parkingspot') {
                                            props.onChangeDrawingType('marker');
                                        }

                                        props.onChangeIsRedrawing(true);
                                    }
                                }} />
                        </UXPTooltip>

                        <UXPTooltip content={'Edit Selected Item'} position="bottom">
                            <Button
                                loading={props.isButtonsLoading}
                                className="map-control-button"
                                icon={editIcon}
                                title={""}
                                onClick={() => {
                                    if (selectedParkingInformation?.type === 'parkingspot') {
                                        handleEditParkingSpot(selectedParkingInformation?.entity as IParkingSpot)
                                    } else if (selectedParkingInformation?.type === 'parkinggroup') {
                                        handleEditParkingGroup(selectedParkingInformation?.entity as IParkingGroup)
                                    } else if (selectedParkingInformation?.type === 'parkingsite') {
                                        handleEditParkingSite(selectedParkingInformation?.entity as IParkingSite)
                                    }
                                }} />
                        </UXPTooltip>
                    </Conditional>

                    <Conditional visible={hasPermissions("delete")}>
                        <UXPTooltip content={'Delete Selected Item'} position="left">
                            <Button
                                loading={props.isButtonsLoading}
                                className="map-control-button"
                                icon={deleteIcon}
                                title={""}
                                onClick={() => {
                                    if (selectedParkingInformation?.type === 'parkingspot') {
                                        handleDeleteParkingSpot(selectedParkingInformation?.entity as IParkingSpot)
                                    } else if (selectedParkingInformation?.type === 'parkinggroup') {
                                        handleDeleteParkingGroup(selectedParkingInformation?.entity as IParkingGroup)
                                    } else if (selectedParkingInformation?.type === 'parkingsite') {
                                        handleDeleteParkingSite(selectedParkingInformation?.entity as IParkingSite)
                                    }
                                }} />
                        </UXPTooltip>
                    </Conditional>
                </Conditional>

            </div>
            <Map
                id="uxp-map-component-container"
                ref={mapRef}
                editable={true}
                zoom={zoomLevel}
                maxZoom={22}
                ondragend={(e) => {
                    onChangeZoomLevel(e.target.getZoom())
                    onChangeCenterOfMap(e.target.getCenter())
                }}
                center={centerOfMap}
                onzoom={(e) => {
                    onChangeZoomLevel(e.target.getZoom())
                    onChangeCenterOfMap(e.target.getCenter())
                }}
            >
                <TileLayer
                    url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    attribution='&amp;copy <a href="https://www.google.com/intl/en-US/help/terms_maps/">Google Maps</a>'
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                />
                {
                    canViewParkingSite && parkingSites.map((parkingSite) => {

                        let selectedParkingSite = selectedParkingInformation?.entity as IParkingSite;

                        let isThisSiteSelected = selectedParkingInformation?.type === 'parkingsite' &&
                            selectedParkingSite?.[`${selectedParkingSite?.type}.id`] === parkingSite?.[`${parkingSite?.type}.id`]

                        let isThisSiteRedrawing = props.isRedrawing && isThisSiteSelected;
                        return (
                            // Renders only if not redrawing
                            <Conditional
                                key={parkingSite?.[`${parkingSite?.type}.id`]}
                                visible={!isThisSiteRedrawing}>
                                <ParkingSitePolygon
                                    key={parkingSite?.[`${parkingSite?.type}.id`]}
                                    onClick={() => {
                                        if (props.isRedrawing) return;

                                        onChangeSelectedParkingInformation({ type: 'parkingsite', entity: parkingSite });
                                    }}
                                    selected={isThisSiteSelected}
                                    parkingSite={parkingSite}
                                />
                            </Conditional>
                        )
                    })
                }
                {
                    canViewParkingGroup && parkingGroups.map((parkingGroup) => {
                        let isThisGroupSelected = selectedParkingInformation?.type === 'parkinggroup' &&
                            (selectedParkingInformation?.entity as IParkingGroup)?.['ParkingGroup.id'] === parkingGroup?.['ParkingGroup.id'];

                        let isThisGroupRedrawing = !!props.isRedrawing && isThisGroupSelected;
                        return (
                            // Renders only if not redrawing
                            <Conditional
                                key={parkingGroup['ParkingGroup.id']}
                                visible={!isThisGroupRedrawing && zoomLevel >= 20}>
                                <ParkingGroupPolygon
                                    key={parkingGroup['ParkingGroup.id']}
                                    onClick={() => {
                                        if (props.isRedrawing) return;
                                        onChangeSelectedParkingInformation({ type: 'parkinggroup', entity: parkingGroup });
                                    }}
                                    selected={isThisGroupSelected}
                                    parkingGroup={parkingGroup}
                                />
                            </Conditional>
                        )
                    })
                }

                {
                    canViewParkingSpot && parkingSpots.map((parkingSpot) => {
                        let isThisSpotSelected = selectedParkingInformation?.type === 'parkingspot' &&
                            (selectedParkingInformation?.entity as IParkingSpot)?.['ParkingSpot.id'] === parkingSpot?.['ParkingSpot.id'];

                        let isThisSpotRedrawing = props.isRedrawing && isThisSpotSelected;
                        return (
                            // Renders only if not redrawing
                            <Conditional
                                key={parkingSpot['ParkingSpot.id']}
                                visible={!isThisSpotRedrawing && zoomLevel >= 20}>
                                <ParkingSpotCircle
                                    key={parkingSpot['ParkingSpot.id']}
                                    onClick={() => {
                                        if (props.isRedrawing) return;
                                        onChangeSelectedParkingInformation({ type: 'parkingspot', entity: parkingSpot });
                                    }}
                                    selected={isThisSpotSelected}
                                    parkingSpot={parkingSpot}
                                />
                            </Conditional>
                        )
                    })
                }
            </Map>

            <Conditional visible={!props.hideZoomWarning}>
                <div className="zoom-notification">Zoom level: {zoomLevel} {zoomLevel <= 20 ? ' | Some street may be little bit narrower than they appear on google maps' : ''}</div>
            </Conditional>

            <ConfirmPopup
                show={editingLocation}
                onConfirm={{
                    execute: () => onEditingLocation(),
                    onComplete: () => {
                    },
                    onError: (e) => {
                    }
                }}
                onCancel={() => {
                    setEditingLocation(false)
                    // clearTheDrawnAreasOfMap()
                    // props.onChangeIsRedrawing(false);
                    // props.onChangeDrawingType(null);

                    if (props?.handleOnCancelDrawParkingInformationButtonClick) {
                        props.handleOnCancelDrawParkingInformationButtonClick()
                    }
                }}
                message={`Do you really want to change the shape ?`}
                processingMessage={`Updating shape...`}
            />

        </div>
    );
});

interface IParkingSitePolygonProps {
    parkingSite: IParkingSite;
    selected: boolean;
    onClick: (e: LeafletMouseEvent) => any;
}

const ParkingSitePolygon: React.VoidFunctionComponent<IParkingSitePolygonProps> = ({ parkingSite, onClick, selected }) => {
    const location = parkingSite?.[`${parkingSite?.type}.location`]
    const polygon = React.useRef<Polygon>();

    return (
        <Polygon
            ref={polygon}
            color={!selected ? '#77cefd' : '#0497e7'}

            //Here we need to exchange the longitute and latitude because geojson have saved it like that
            positions={(location.coordinates[0].map((tuple: LatLngTuple) => ({ lat: tuple[1], lng: tuple[0] }))) as LatLngExpression[]}
            onclick={onClick}>

            <Tooltip opacity={0.8} className="parking-site-tooltip" direction={'top'} permanent={true}>{parkingSite?.[`${parkingSite?.type}.name`]}</Tooltip>
        </Polygon>
    )
}

interface IParkingGroupPolygonProps {
    parkingGroup: IParkingGroup;
    selected: boolean;
    onClick: (e: LeafletMouseEvent) => any
}

const ParkingGroupPolygon: React.VoidFunctionComponent<IParkingGroupPolygonProps> = ({ parkingGroup, onClick, selected }) => {
    const location = parkingGroup['ParkingGroup.location']
    const polygon = React.useRef<Polygon>();

    return (
        <Polygon
            ref={polygon}
            color={!selected ? '#51e561' : '#009d11'}

            // Here we need to exchange the longitute and latitude because geojson have saved it like that
            positions={(location.coordinates[0].map((tuple: LatLngTuple) => ({ lat: tuple[1], lng: tuple[0] }))) as LatLngExpression[]}
            onclick={onClick}>

            <Tooltip opacity={0.8} className="parking-group-tooltip" direction={'top'} permanent={true}>{parkingGroup['ParkingGroup.name']}</Tooltip>
        </Polygon>
    )
}

interface IParkingSpotCircleProps {
    parkingSpot: IParkingSpot;
    selected: boolean;
    onClick: (e: LeafletMouseEvent) => any
}

const ParkingSpotCircle: React.VoidFunctionComponent<IParkingSpotCircleProps> = ({ parkingSpot, onClick, selected }) => {
    const location = parkingSpot['ParkingSpot.location']
    const circle = React.useRef<Circle>();

    const fillColor = React.useMemo<string>(() => {
        if (parkingSpot?.['ParkingSpot.status'] === 'occupied') {
            return !selected ? '#ff8d8d' : '#ff2120';
        } else {
            return !selected ? '#e0ff00' : '#c1c100';
        }
    }, [selected, parkingSpot?.['ParkingSpot.status']])
    return (
        <Circle
            ref={circle}
            color={'#ffffff'}
            fillColor={fillColor}
            radius={0.48}
            fillOpacity={0.8}
            center={{ lat: location.coordinates[1], lng: location.coordinates[0] } as LatLngExpression}
            onclick={onClick}>

            <Tooltip className={`parking-spot-tooltip ${parkingSpot?.['ParkingSpot.status'] === 'occupied' ? 'occupied' : ''}`} direction={'top'} permanent={true}>{parkingSpot['ParkingSpot.name']}</Tooltip>
        </Circle>
    )
}


export interface IParkingTableContext {
    search: string
}

export const ParkingTableContext = React.createContext<IParkingTableContext>({ search: '' });

interface IParkingInformationTableProps {
    search: string
}

export const ParkingInformationTable: React.VoidFunctionComponent<IParkingInformationTableProps> = (props) => {

    const {
        parkingSites,
        parkingGroups,
        parkingSpots,
        selectedParkingInformation,
        roles: {
            canCreateParkingSite,
            canEditParkingSite,
            canDeleteParkingSite,
            canViewParkingSite,
            canCreateParkingGroup,
            canEditParkingGroup,
            canDeleteParkingGroup,
            canViewParkingGroup,
            canCreateParkingSpot,
            canEditParkingSpot,
            canDeleteParkingSpot,
            canViewParkingSpot
        },
        hasPermissions
    } = React.useContext(ParkingInformationContext);

    if (parkingSites.length > 0 && canViewParkingSite) {
        let parkingSitesToBeShown = parkingSites

        if (selectedParkingInformation?.entity && selectedParkingInformation?.type === 'parkingsite') {
            parkingSitesToBeShown = [selectedParkingInformation?.entity as IParkingSite]
        } else if (selectedParkingInformation?.entity && selectedParkingInformation?.type === 'parkinggroup') {
            const selectedParkingGroup = selectedParkingInformation?.entity as IParkingGroup
            let parkingSiteOfSelectedGroup = parkingSites?.find((site) => selectedParkingGroup?.['ParkingGroup.refParkingSite'] === site?.[`${site?.type}.id`])

            parkingSitesToBeShown = [parkingSiteOfSelectedGroup]
        } else if (selectedParkingInformation?.entity && selectedParkingInformation?.type === 'parkingspot') {
            const selectedParkingSpot = selectedParkingInformation?.entity as IParkingSpot
            let parkingGroupOfSelectedSpot = parkingGroups?.find((group) => selectedParkingSpot?.['ParkingSpot.refParkingGroup'] === group['ParkingGroup.id'])
            let parkingSiteOfThatGroup = parkingSites?.find((site) => parkingGroupOfSelectedSpot?.['ParkingGroup.refParkingSite'] === site?.[`${site?.type}.id`])

            parkingSitesToBeShown = [parkingSiteOfThatGroup]
        }

        return (
            <ParkingTableContext.Provider value={{ search: props.search }}>
                <table className="parking-information-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Site Name</th>
                            <th>Parking Type</th>
                            <th>Available Spots</th>
                            <th>Total Spots</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            parkingSitesToBeShown.map((parkingSite) => {
                                const ifSiteHasSearchString = (parkingSite?.[`${parkingSite?.type}.name`] as string)?.toLowerCase().includes(props.search.toLowerCase());

                                const parkingGroupsOfParkingSites = parkingGroups?.filter((group => group['ParkingGroup.refParkingSite'] == parkingSite?.[`${parkingSite?.type}.id`]));

                                const ifAnyOfItsParkingGroupsHasSearchString = !!parkingGroupsOfParkingSites?.find(
                                    (group) => group['ParkingGroup.name']?.toLowerCase().includes(props.search.toLowerCase())
                                )

                                const ifAnyOfItsParkingSpotsHasSearchString = !!parkingSpots?.find(
                                    (spot) => spot['ParkingSpot.name']?.toLowerCase().includes(props.search.toLowerCase()) &&
                                        parkingGroupsOfParkingSites.find((group) => spot['ParkingSpot.refParkingGroup'] === group['ParkingGroup.id'])
                                )

                                return (
                                    <Conditional
                                        key={parkingSite?.[`${parkingSite?.type}.id`]}
                                        visible={
                                            ifSiteHasSearchString || ifAnyOfItsParkingGroupsHasSearchString || ifAnyOfItsParkingSpotsHasSearchString
                                        }>

                                        <ParkingSiteRow
                                            key={parkingSite?.[`${parkingSite?.type}.id`]}
                                            parkingSite={parkingSite}
                                        />
                                    </Conditional>
                                )
                            })
                        }

                    </tbody>
                </table>
            </ParkingTableContext.Provider>
        )
    } else {
        return <h3 style={{ textAlign: 'center', padding: '12px' }}>
            {canViewParkingSite ? "No available parking sites" : "Not authorized to view this content"}
        </h3>

    }
}

interface IParkingSiteRowProps {
    parkingSite: IParkingSite;
}

const ParkingSiteRow: React.VoidFunctionComponent<IParkingSiteRowProps> = ({ parkingSite }) => {

    const {
        handleDeleteParkingSite,
        handleEditParkingSite,
        gotoPositionOfMap,
        parkingInformationTableEditable,
        parkingSites,
        parkingGroups,
        roles: {
            canCreateParkingSite,
            canEditParkingSite,
            canDeleteParkingSite,
            canViewParkingSite,
            canCreateParkingGroup,
            canEditParkingGroup,
            canDeleteParkingGroup,
            canViewParkingGroup,
            canCreateParkingSpot,
            canEditParkingSpot,
            canDeleteParkingSpot,
            canViewParkingSpot
        },
        hasPermissions,
        selectedParkingInformation
    } = React.useContext(ParkingInformationContext);

    const [hasOpened, setHasOpened] = useState<boolean>(false)

    // Auto Expanding Feature
    React.useEffect(() => {
        if (selectedParkingInformation?.type == 'parkingsite') {
            setHasOpened(false)
        } else if (selectedParkingInformation?.type == 'parkinggroup') {
            const selectedParkingGroup = selectedParkingInformation?.entity as IParkingGroup

            setHasOpened(selectedParkingGroup?.['ParkingGroup.refParkingSite'] === parkingSite?.[`${parkingSite?.type}.id`])
        } else if (selectedParkingInformation?.type == 'parkingspot') {
            const selectedParkingSpot = selectedParkingInformation?.entity as IParkingSpot
            let parkingGroupOfSelectedParkingSpot = parkingGroups?.find((spot) => selectedParkingSpot?.['ParkingSpot.refParkingGroup'] === spot?.['ParkingGroup.id'])

            setHasOpened(parkingGroupOfSelectedParkingSpot?.['ParkingGroup.refParkingSite'] === parkingSite?.[`${parkingSite?.type}.id`])
        }
    }, [selectedParkingInformation?.entity])

    return (
        <>
            <tr>
                <td>
                    <IconButton
                        type={'arrow-down'}
                        onClick={() => setHasOpened(!hasOpened)}
                        className={`icon toggle ${hasOpened ? 'is-expanded' : ''}`}
                    />
                </td>
                <td style={{ fontWeight: '700' }}>{parkingSite?.[`${parkingSite?.type}.name`]}</td>
                <td style={{ textTransform: 'uppercase' }}>{parkingSite?.type}</td>
                <td style={{ fontSize: '14px', fontWeight: '700' }}>{parkingSite?.[`${parkingSite?.type}.availableSpotNumber`]}</td>
                <td style={{ fontSize: '14px', fontWeight: '700' }}>{parkingSite?.[`${parkingSite?.type}.totalSpotNumber`]}</td>
                <td>

                    <UXPTooltip content="Go To Map" position="bottom">
                        <Button
                            className="only-icon-button"
                            icon={mapIcon}
                            title={''}
                            onClick={() => { gotoPositionOfMap(parkingSite?.[`${parkingSite?.type}.location`], 21) }}
                        />

                    </UXPTooltip>
                    <Conditional visible={!!parkingInformationTableEditable}>
                        <Conditional visible={canEditParkingSite}>
                            <UXPTooltip content="Update Site" position="bottom">
                                <Button
                                    className="only-icon-button"
                                    icon={editIcon}
                                    title={''}
                                    onClick={() => { handleEditParkingSite(parkingSite) }}
                                />
                            </UXPTooltip>
                        </Conditional>
                        <Conditional visible={canDeleteParkingSite}>
                            <UXPTooltip content="Delete Site" position="bottom">
                                <Button
                                    className="only-icon-button"
                                    icon={deleteIcon}
                                    title={''}
                                    onClick={() => { handleDeleteParkingSite(parkingSite) }}
                                />
                            </UXPTooltip>
                        </Conditional>
                    </Conditional>
                </td>
            </tr>
            <tr className="collapsable-table-row" aria-expanded={hasOpened}>
                <td style={{ padding: '0px', paddingLeft: '30px' }} colSpan={6}>
                    <div className="parking-groups-table-wrapper">
                        <ParkingGroupsOfParkingSiteTable parkingSite={parkingSite} />
                    </div>
                </td>
            </tr>
        </>
    );
}

interface IParkingGroupsOfParkingSiteTableProps {
    parkingSite: IParkingSite;
}

const ParkingGroupsOfParkingSiteTable: React.VoidFunctionComponent<IParkingGroupsOfParkingSiteTableProps> = ({ parkingSite }) => {

    const {
        parkingSites,
        parkingGroups,
        parkingSpots,
        roles: {
            canCreateParkingSite,
            canEditParkingSite,
            canDeleteParkingSite,
            canViewParkingSite,
            canCreateParkingGroup,
            canEditParkingGroup,
            canDeleteParkingGroup,
            canViewParkingGroup,
            canCreateParkingSpot,
            canEditParkingSpot,
            canDeleteParkingSpot,
            canViewParkingSpot
        },
        hasPermissions
    } = React.useContext(ParkingInformationContext);

    const { search } = React.useContext(ParkingTableContext)

    const parkingGroupsBelongsToTheParkingSite = parkingGroups.filter(
        (group) => group['ParkingGroup.refParkingSite'] === parkingSite?.[`${parkingSite?.type}.id`]
    )

    if (parkingGroupsBelongsToTheParkingSite.length > 0 && canViewParkingGroup) {
        return (
            <table className="parking-groups-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Group Name</th>
                        <th>Max Duration</th>
                        <th>Permit Type</th>
                        <th>Allowed Vehicles</th>
                        <th>Charge Type</th>
                        <th>Max Height</th>
                        <th>Max Width</th>
                        <th>Total Spots</th>
                        <th>Available Spots</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        parkingGroupsBelongsToTheParkingSite.map((parkingGroup) => {
                            const parkingSite = parkingSites?.find((site) => parkingGroup['ParkingGroup.refParkingSite'] === site?.[`${site?.type}.id`]);
                            const ifSiteHasSearchString = parkingSite?.[`${parkingSite?.type}.name`].toLowerCase().includes(search.toLowerCase())

                            const ifGroupHasSearchString = parkingGroup?.['ParkingGroup.name'].toLowerCase().includes(search.toLowerCase());

                            const parkingSpotsBelongsToParkingGroup = parkingSpots?.filter((spot => spot['ParkingSpot.refParkingGroup'] == parkingGroup['ParkingGroup.id']));

                            const ifAnyOfItsParkingSpotsHasSearchString = !!parkingSpotsBelongsToParkingGroup?.find(
                                (spot) => spot['ParkingSpot.name']?.toLowerCase().includes(search.toLowerCase())
                            )

                            return (
                                <Conditional
                                    key={parkingSite?.[`${parkingSite?.type}.id`]}
                                    visible={ifSiteHasSearchString || ifGroupHasSearchString || ifAnyOfItsParkingSpotsHasSearchString}
                                >
                                    <ParkingGroupRow
                                        key={parkingGroup['ParkingGroup.id']}
                                        parkingGroup={parkingGroup}
                                    />
                                </Conditional>
                            )
                        })
                    }
                </tbody>
            </table>
        )
    } else {

        return <h4 style={{ textAlign: 'center', padding: '12px' }}>
            {canViewParkingGroup ? "No available parking groups in this site" : "Not ahthorized to view this content"}
        </h4>
    }
}

interface IParkingGroupRowProps {
    parkingGroup: IParkingGroup;
}


const ParkingGroupRow: React.VoidFunctionComponent<IParkingGroupRowProps> = ({ parkingGroup }) => {
    const {
        handleDeleteParkingGroup,
        handleEditParkingGroup,
        gotoPositionOfMap,
        parkingInformationTableEditable,
        selectedParkingInformation,
        roles: {
            canCreateParkingSite,
            canEditParkingSite,
            canDeleteParkingSite,
            canViewParkingSite,
            canCreateParkingGroup,
            canEditParkingGroup,
            canDeleteParkingGroup,
            canViewParkingGroup,
            canCreateParkingSpot,
            canEditParkingSpot,
            canDeleteParkingSpot,
            canViewParkingSpot
        },
        hasPermissions
    } = React.useContext(ParkingInformationContext);

    const [hasOpened, setHasOpened] = useState<boolean>(false)

    // Auto Expanding Feature
    React.useEffect(() => {
        if (selectedParkingInformation?.type == 'parkinggroup' || selectedParkingInformation?.type == 'parkingsite') {
            setHasOpened(false)
        } else if (selectedParkingInformation?.type == 'parkingspot') {
            const selectedParkingSpot = selectedParkingInformation?.entity as IParkingSpot
            setHasOpened(selectedParkingSpot?.['ParkingSpot.refParkingGroup'] === parkingGroup?.['ParkingGroup.id'])
        }
    }, [selectedParkingInformation?.entity])

    return (
        <>
            <tr>
                <td>
                    <IconButton
                        type="arrow-down"
                        onClick={() => setHasOpened(!hasOpened)}
                        className={`icon toggle ${hasOpened ? 'is-expanded' : ''}`}
                    />
                </td>
                <td style={{ fontWeight: '700' }}>{parkingGroup['ParkingGroup.name']}</td>
                <td>{parkingGroup['ParkingGroup.maximumParkingDuration']}</td>
                <td style={{ textTransform: 'uppercase' }}>{parkingGroup['ParkingGroup.requiredPermit']}</td>
                <td>{parkingGroup['ParkingGroup.allowedVehicleType']}</td>
                <td style={{ textTransform: 'uppercase' }}>{parkingGroup['ParkingGroup.chargeType'].length > 0 ? parkingGroup['ParkingGroup.chargeType'].join(', ') : ''}</td>
                <td>{parkingGroup['ParkingGroup.maximumAllowedHeight']}</td>
                <td>{parkingGroup['ParkingGroup.maximumAllowedWidth']}</td>
                <td style={{ fontSize: '12px', fontWeight: '700' }}>{parkingGroup['ParkingGroup.totalSpotNumber']}</td>
                <td style={{ fontSize: '12px', fontWeight: '700' }}>{parkingGroup['ParkingGroup.availableSpotNumber']}</td>
                <td>

                    <UXPTooltip content="Go To Map" position="bottom">
                        <Button
                            className="only-icon-button"
                            icon={mapIcon}
                            title={''}
                            onClick={() => { gotoPositionOfMap(parkingGroup['ParkingGroup.location'], 22) }}
                        />

                    </UXPTooltip>

                    <Conditional visible={!!parkingInformationTableEditable}>
                        <Conditional visible={canEditParkingGroup}>
                            <UXPTooltip content="Update Group" position="bottom">
                                <Button
                                    className="only-icon-button"
                                    icon={editIcon}
                                    title={''}
                                    onClick={() => { handleEditParkingGroup(parkingGroup) }}
                                />
                            </UXPTooltip>
                        </Conditional>
                        <Conditional visible={canDeleteParkingGroup}>
                            <UXPTooltip content="Delete Group" position="bottom">
                                <Button
                                    className="only-icon-button"
                                    icon={deleteIcon}
                                    title={''}
                                    onClick={() => { handleDeleteParkingGroup(parkingGroup) }}
                                />
                            </UXPTooltip>
                        </Conditional>
                    </Conditional>
                </td>
            </tr>

            <tr className="collapsable-table-row" aria-expanded={hasOpened}>
                <td style={{ padding: '0px', paddingLeft: '70px' }} colSpan={11}>
                    <div className="parking-spots-table-wrapper">
                        <ParkingSpotsOfParkingGroupTable parkingGroup={parkingGroup} />
                    </div>
                </td>
            </tr>
        </>
    );
}


interface IParkingSpotsOfParkingGroupTableProps {
    parkingGroup: IParkingGroup;
}

const ParkingSpotsOfParkingGroupTable: React.VoidFunctionComponent<IParkingSpotsOfParkingGroupTableProps> = ({ parkingGroup }) => {

    const {
        parkingSpots,
        parkingGroups,
        parkingSites,
        handleDeleteParkingSpot,
        handleEditParkingSpot,
        gotoPositionOfMap,
        parkingInformationTableEditable,
        roles: {
            canCreateParkingSite,
            canEditParkingSite,
            canDeleteParkingSite,
            canViewParkingSite,
            canCreateParkingGroup,
            canEditParkingGroup,
            canDeleteParkingGroup,
            canViewParkingGroup,
            canCreateParkingSpot,
            canEditParkingSpot,
            canDeleteParkingSpot,
            canViewParkingSpot
        },
        hasPermissions
    } = React.useContext(ParkingInformationContext);

    const { search } = React.useContext(ParkingTableContext)

    const parkingSpotsBelongsToTheParkingGroup = parkingSpots.filter(
        (spot) => spot['ParkingSpot.refParkingGroup'] === parkingGroup['ParkingGroup.id']
    )

    if (parkingSpotsBelongsToTheParkingGroup.length > 0 && canViewParkingSpot) {
        return (
            <table className="parking-spots-table">
                <thead>
                    <tr>
                        <th>Spot Name</th>
                        <th>Status</th>
                        <th>Devices</th>
                        {/* <th>Booking ID</th> */}
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        parkingSpotsBelongsToTheParkingGroup.map((parkingSpot) => {
                            const ifSpotHasSearchString = parkingSpot?.['ParkingSpot.name'].toLowerCase().includes(search.toLowerCase());

                            const parkingGroup = parkingGroups?.find((group) => group['ParkingGroup.id'] === parkingSpot['ParkingSpot.refParkingGroup']);
                            const ifGroupHasSearchString = parkingGroup['ParkingGroup.name'].toLowerCase().includes(search.toLowerCase())

                            const parkingSite = parkingSites?.find((site) => parkingGroup['ParkingGroup.refParkingSite'] === site?.[`${site?.type}.id`]);
                            const ifSiteHasSearchString = parkingSite?.[`${parkingSite?.type}.name`].toLowerCase().includes(search.toLowerCase())

                            return (
                                <Conditional visible={ifSpotHasSearchString || ifGroupHasSearchString || ifSiteHasSearchString}>
                                    <tr key={parkingSpot['ParkingSpot.id']}>
                                        <td style={{ fontWeight: '700' }}>{parkingSpot['ParkingSpot.name']}</td>
                                        <td>{parkingSpot['ParkingSpot.status']}</td>
                                        <td>#</td>
                                        {/* <td>#</td> */}
                                        <td>

                                            <UXPTooltip content="Go To Map" position="bottom">
                                                <Button
                                                    className="only-icon-button"
                                                    icon={mapIcon}
                                                    title={''}
                                                    onClick={() => { gotoPositionOfMap(parkingSpot['ParkingSpot.location'], 22) }}
                                                />

                                            </UXPTooltip>

                                            <Conditional visible={!!parkingInformationTableEditable}>
                                                <Conditional visible={canEditParkingSpot}>
                                                    <UXPTooltip content="Update Spot" position="bottom">
                                                        <Button
                                                            className="only-icon-button"
                                                            icon={editIcon}
                                                            title={''}
                                                            onClick={() => { handleEditParkingSpot(parkingSpot) }}
                                                        />
                                                    </UXPTooltip>
                                                </Conditional>
                                                <Conditional visible={canDeleteParkingSpot}>
                                                    <UXPTooltip content="Delete Spot" position="bottom">
                                                        <Button
                                                            className="only-icon-button"
                                                            icon={deleteIcon}
                                                            title={''}
                                                            onClick={() => { handleDeleteParkingSpot(parkingSpot) }}
                                                        />
                                                    </UXPTooltip>
                                                </Conditional>
                                            </Conditional>
                                        </td>
                                    </tr>
                                </Conditional>
                            )
                        })
                    }
                </tbody>
            </table>
        )
    } else {
        return <h5 style={{ textAlign: 'center', padding: '5px' }}>
            {canViewParkingSpot ? "No available parking spots in this group" : "Not authorized to view this content"}
        </h5>
    }
}

export default ParkingInformation