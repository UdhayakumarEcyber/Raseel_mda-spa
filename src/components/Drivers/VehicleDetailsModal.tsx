import React, { useState } from "react";
import { Button, FormField, Input, ItemListCard, Label, Loading, Modal, Select, Tooltip, useToast } from "uxp/components";
import { handleErrorResponse } from "../../utils";
import { IContextProvider } from "../../uxp";
import { Conditional } from "../common/ConditionalComponent";
import { ValidatableForm, ValidatableFormField, ValidatableFormRef } from "../common/ValidatableForm";
import { IVehicleModel } from "../VehiclesModel/VehiclesModel";
import { findDriverById, IDriver } from "./Drivers";

import searchIcon from '../../assets/images/search.svg'
import deleteIcon from '../../assets/images/delete.svg'
import infoIcon from '../../assets/images/information.svg'
import ConfirmPopup from "../common/PopupAlert/ConfirmPopup";
import { getCurrentUserDetails } from "../Users/User";

export type ModalState = 'create' | 'edit' | 'view';

export interface IVehicle {
    'id': string;
    'Vehicle.vehiclePlateIdentifier': string;
    'Vehicle.frontPicture': string;
    'driverIds': string[];
    'Vehicle.vehicleType': string;
    'Vehicle.category': string;
    'Vehicle.refVehicleModel': string;
    'Vehicle.description': string;
    'Vehicle.Type': string;
}

export interface IVehicleBrand {
    id: string;
    name: string;
    manufacturer: string;
    published: boolean;
    hasMore: boolean;
}

export interface IVehicleManufacture {
    id: string;
    name: string;
}

interface IVehicleDetailsModalProps {
    uxpContext: IContextProvider,
    show: boolean,
    editingDriver: IDriver,
    onClose?: () => any,
    afterSave?: () => any,
}

export async function fetchAllVehicles(uxpContext: IContextProvider): Promise<IVehicle[]> {
    try {
        console.log('Fetching all vehicles');

        const result = await uxpContext.executeAction('Vehicle', 'vehicleAll', {}, { json: true });

        return result.data as IVehicle[];

    } catch (err) { console.error(err); throw err; }
}

export async function findVehicleDetailsByVehiclePlateIdentifier(vehiclePlateIdentifier: string, uxpContext: IContextProvider): Promise<IVehicle> {
    try {
        const result = await uxpContext.executeAction('Vehicle', 'vehicleDetails', { id: vehiclePlateIdentifier }, { json: true });

        return { ...result.data } as IVehicle;

    } catch (err) { console.error(err); throw err; }
}

export async function fetchVehicleBrands(uxpContext: IContextProvider): Promise<IVehicleBrand[]> {
    try {
        const result = await uxpContext.executeAction('Vehicle', 'vehicle_brandAll', {}, { json: true });

        return result.data as IVehicleBrand[];

    } catch (err) { console.error(err); throw err; }
}

export async function fetchVehicleManufactures(uxpContext: IContextProvider): Promise<IVehicleManufacture[]> {
    try {
        const result = await uxpContext.executeAction('Vehicle', 'vehicle_manufacturerAll', {}, { json: true });

        return result.data as IVehicleManufacture[];

    } catch (err) { console.error(err); throw err; }
}

export async function fetchVehicleTypes(uxpContext: IContextProvider): Promise<string[]> {
    try {
        const result = await uxpContext.executeAction('Vehicle', 'VehicleTypes', {}, { json: true });

        return result as string[];

    } catch (err) { console.error(err); throw err; }
}

export async function fetchVehicleCategories(uxpContext: IContextProvider): Promise<string[]> {
    try {
        const result = await uxpContext.executeAction('Vehicle', 'VehicleCategories', {}, { json: true });

        return result as string[];

    } catch (err) { console.error(err); throw err; }
}

export async function fetchVehicleModels(uxpContext: IContextProvider): Promise<IVehicleModel[]> {
    try {
        const result = await uxpContext.executeAction('Vehicle', 'vehicle_modelAll', {}, { json: true });

        return result.data as IVehicleModel[];

    } catch (err) { console.error(err); throw err; }
}

export async function findVehicleById(id: string, uxpContext: IContextProvider): Promise<IVehicle> {
    try {
        console.log(`Finding vehicle : ${id} ...`);

        const response = await uxpContext.executeAction('Vehicle', 'vehicleDetails', { id }, { json: true });

        return { id, ...response?.data } as IVehicle;
    } catch (err) { console.error(err); throw err; }
}

export async function createNewVehicle(data: any, uxpContext: IContextProvider): Promise<string> {
    try {
        console.log('Creating new vehicle...');

        const response = await uxpContext.executeAction('Vehicle', 'vehicleCreate', data, { json: true });

        return response.data['id'];
    } catch (err) { console.error(err); throw err; }
}

export async function updateDriverListOfExistingVehicle(id: string, driverIds: string[], uxpContext: IContextProvider): Promise<string> {
    try {
        console.log('Editing vehicle...');

        await uxpContext.executeAction('Vehicle', 'vehicleUpdate', { id, driverIds: JSON.stringify(driverIds) }, { json: true });

        return id;
    } catch (err) { console.error(err); throw err; }
}

export async function removeVehicle(id: string, uxpContext: IContextProvider): Promise<void> {
    try {
        console.log('Removing vehicle...');

        await uxpContext.executeAction('Vehicle', 'vehicleDelete', { id }, { json: true });
    } catch (err) { console.error(err); throw err; }
}

const VehicleDetailsModal: React.VoidFunctionComponent<IVehicleDetailsModalProps> = (props) => {

    const toast = useToast();

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [isLoadingAdd, setIsLoadingAdd] = React.useState<boolean>(false);

    const [vehicleManufactures, setVehicleManufactures] = React.useState<IVehicleManufacture[]>([]);
    const [vehicleBrands, setVehicleBrands] = React.useState<IVehicleBrand[]>([]);
    const [vehicleModels, setVehicleModels] = React.useState<IVehicleModel[]>([]);
    const [filteredVehicleModels, setFilteredVehicleModels] = React.useState<IVehicleModel[]>([]);

    const [vehicleTypes, setVehicleTypes] = React.useState<string[]>([]);
    const [vehicleCategories, setVehicleCategories] = React.useState<string[]>([]);

    const [selectedVehicleManufacturerName, setSelectedVehicleManufacturerName] = React.useState<string>();
    const [selectedVehicleBrandName, setSelectedVehicleBrandName] = React.useState<string>();
    const [selectedVehicleModel, setSelectedVehicleModel] = React.useState<IVehicleModel>();
    const [vehiclePlateIdentifier, setVehiclePlateIdentifier] = React.useState<string>();
    const [selectedVehicleType, setSelectedVehicleType] = React.useState<string>();
    const [selectedVehicleCategory, setSelectedVehicleCategory] = React.useState<string>();
    const [vehicleDescription, setVehicleDescription] = React.useState<string>('');

    const [vehiclesOfDriver, setVehiclesOfDriver] = React.useState<IVehicle[]>([]);
    const [loadingVehiclesOfDriver, setLoadingVehiclesOfDriver] = React.useState<boolean>(false);

    type SelectedTabViewType = 'addNewVehicle' | 'addExistingVehicle' | 'viewVehicleList'
    const [selectedTabView, setSelectedTabView] = React.useState<SelectedTabViewType>('viewVehicleList');
    const [userDetails, setUserDetails] = React.useState(null);

    React.useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetchVehicleTypes(props.uxpContext),
            fetchVehicleCategories(props.uxpContext),
            fetchVehicleBrands(props.uxpContext),
            fetchVehicleManufactures(props.uxpContext),
            fetchVehicleModels(props.uxpContext),
            getCurrentUserDetails(props.uxpContext)
        ]).then((result) => {
            const [types, categories, brands, manufactures, vehicleModels, userDetails] = result;

            setVehicleManufactures(manufactures)
            setVehicleModels(vehicleModels)
            setFilteredVehicleModels(vehicleModels)

            setVehicleBrands(brands)
            setVehicleTypes(types)
            setVehicleCategories(categories)
            setUserDetails(userDetails)

        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
        }).finally(() => {
            setIsLoading(false);
        });
    }, [])

    const retrieveVehiclesOfDriver = async () => {
        setLoadingVehiclesOfDriver(true)
        Promise.all([
            fetchAllVehicles(props.uxpContext),
            findDriverById(props.editingDriver?.id, props.uxpContext),
        ]).then((result) => {
            const [vehicles, driver] = result

            const vehiclesOfDriver = vehicles.filter((vehicle) => driver["Driver.vehicleIds"]?.includes(vehicle.id))
            setVehiclesOfDriver(vehiclesOfDriver)
        }).catch((err) => {
            toast.error('Error while retrieving parking informations. Please refresh...');
        }).finally(() => {
            setLoadingVehiclesOfDriver(false);
        });
    }

    React.useEffect(() => {
        if (!props.editingDriver) return;

        retrieveVehiclesOfDriver();
    }, [props.editingDriver])

    React.useLayoutEffect(() => {
        clearAllFields();
    }, [props.show])

    // List vehicle models only for selected manufacturers and brands
    React.useEffect(() => {
        if (!selectedVehicleManufacturerName && !selectedVehicleBrandName) {
            setFilteredVehicleModels(vehicleModels);
            return;
        }

        let filtered = vehicleModels?.filter((model) => {
            if (!selectedVehicleManufacturerName && !selectedVehicleBrandName) return true;
            if (model.manufacturerName === selectedVehicleManufacturerName || model.brandName === selectedVehicleBrandName) {
                return true;
            }
            return false;
        });

        setFilteredVehicleModels(filtered);
    }, [selectedVehicleManufacturerName, selectedVehicleBrandName]);

    React.useEffect(() => {

    }, [selectedTabView])

    const formRef = React.useRef<ValidatableFormRef>();

    const handleAddNewVehicleButtonClick = async () => {
        // Return if form has wrrors
        if (Object.keys(formRef.current?.validateFields(true)).length !== 0) return;

        // Check if the vehicle exists by plate number
        let vehicle: IVehicle = null;
        try {
            vehicle = await findVehicleDetailsByVehiclePlateIdentifier(vehiclePlateIdentifier, props.uxpContext)
        } catch (error) { }

        try {
            setIsLoadingAdd(true)
            if (!vehicle) {
                let data = {
                    "Vehicle.vehiclePlateIdentifier": vehiclePlateIdentifier,
                    // have to figureout what this front picture is
                    "Vehicle.frontPicture": "",
                    "driverId": props.editingDriver?.id,
                    "Vehicle.vehicleType": selectedVehicleType,
                    "Vehicle.category": selectedVehicleCategory,
                    "Vehicle.refVehicleModel": selectedVehicleModel?.id,
                    "Vehicle.description": vehicleDescription
                }

                await createNewVehicle(data, props.uxpContext);
                setSelectedTabView('viewVehicleList')
            } else {
                //If there's already a vehicle with same plate no

                if (!vehiclesOfDriver.find((v) => v.id === vehicle.id)) {
                    toast.warning('A vehicle with same plate number has already been owned by another driver')
                } else {
                    toast.warning('A vehicle with same plate number already has been owned by this driver')
                }
            }
        } catch (error) {
            toast.error(`Something went wrong...`)
        } finally {
            await retrieveVehiclesOfDriver()
            setIsLoadingAdd(false);
            clearAllFields();
        }
    }

    const handleCancelButtonClick = () => {
        props.onClose();
    }

    const clearAllFields = () => {
        setSelectedVehicleCategory(null);
        setSelectedVehicleManufacturerName(null);
        setSelectedVehicleBrandName(null);
        setSelectedVehicleType(null);
        setVehiclePlateIdentifier(null);
        setSelectedVehicleModel(null);
        setVehicleDescription(null);
        formRef.current?.refresh();
    }

    const vehicleTypesOptions = React.useMemo(() => {
        if (!vehicleTypes) return [];

        return vehicleTypes.map((type) => ({ label: type?.toUpperCase(), value: type }))
    }, [vehicleTypes]);

    const vehicleCategoriesOptions = React.useMemo(() => {
        if (!vehicleCategories) return [];

        return vehicleCategories.map((cat) => ({ label: cat?.toUpperCase(), value: cat }))
    }, [vehicleCategories]);

    const handleAfterDeletingAVehicle = async () => {
        await retrieveVehiclesOfDriver();
    }

    const handleOnAddExistingVehicleToDriver = async (vehicle: IVehicle) => {
        try {

            if (!!vehiclesOfDriver.find((v) => v.id === vehicle.id)) {
                toast.warning('A vehicle with same plate number already has been owned by this driver')

            } else {
                const updatedDriverIds = [...vehicle?.driverIds, props.editingDriver?.id];
                await updateDriverListOfExistingVehicle(vehicle?.id, updatedDriverIds, props.uxpContext)
                setSelectedTabView('viewVehicleList')
                await retrieveVehiclesOfDriver();
            }
        } catch (error) {
            const m = handleErrorResponse(error, {
                100202: [
                    { error: 'ERR_UPDATING_VEHICLE', message: 'Something went wrong while updating vehicles...' },
                    { error: 'ERR_VEHICLE_NOT_FOUND', message: 'Vehicle not found...' },
                    { error: 'ERR_DRIVER_ID_IS_EMPTY', message: 'Empty driver id...' },
                    { error: 'ERR_DRIVER_ID_IS_INVALID', message: 'Invalid driver id...' },
                ],
            })

            toast.error(m?.msg)
        } finally {
            retrieveVehiclesOfDriver();
        }
    }

    return (
        <Modal
            className="vehicle-details-modal"
            show={props.show}
            title={`Manage Vehicles Of Driver`}
            onClose={() => { handleCancelButtonClick() }}>
            {
                isLoading ? (
                    <div className="loading-text">
                        <Loading />
                        <span style={{ marginTop: '20px' }}>Loading vehicles of driver </span>
                    </div>
                ) : (
                    <>
                        <div className="tab-control-bar">
                            <Button
                                active={selectedTabView === 'viewVehicleList'}
                                className="tab-control-button"
                                title={'View Vehicle List'}
                                onClick={() => setSelectedTabView('viewVehicleList')} />

                            <Conditional visible={userDetails?.userGroupName == 'spp administrator' || userDetails?.userGroupName == 'po administrator'}>
                                <Button
                                    active={selectedTabView === 'addExistingVehicle'}
                                    className="tab-control-button"
                                    title={'Search Vehicle & Add'}
                                    onClick={() => setSelectedTabView('addExistingVehicle')} />
                            </Conditional>

                            <Button
                                active={selectedTabView === 'addNewVehicle'}
                                className="tab-control-button"
                                title={'Create & Add New Vehicle'}
                                onClick={() => setSelectedTabView('addNewVehicle')} />

                        </div>

                        <Conditional visible={selectedTabView === 'addNewVehicle'}>
                            <div className="tab-panel">
                                <div className="section">
                                    <div className="form-field-group">
                                        <ValidatableForm
                                            validateSchema={{
                                                selectedVehicleManufacturerName: { fieldName: 'selectedVehicleManufacturerName', label: 'Vehicle Manufacture', validatorCollection: ['isRequired'] },
                                                selectedVehicleBrandName: { fieldName: 'selectedVehicleBrandName', label: 'Brand Name', validatorCollection: ['isRequired'] },
                                                selectedVehicleModel: { fieldName: 'selectedVehicleModel', label: 'Vehicle Model', validatorCollection: ['isRequired'] },
                                                vehiclePlateIdentifier: { fieldName: 'vehiclePlateIdentifier', label: 'Vehicle Plate No', validatorCollection: ['isRequired'] },
                                                selectedVehicleType: { fieldName: 'selectedVehicleType', label: 'Vehicle Type', validatorCollection: ['isRequired'] },
                                                selectedVehicleCategory: { fieldName: 'selectedVehicleCategory', label: 'Vehicle Category', validatorCollection: ['isRequired'] },
                                            }}
                                            ref={formRef}>

                                            <ValidatableFormField fieldName="selectedVehicleManufacturerName" label="Vehicle Manufacture *" value={selectedVehicleManufacturerName}>
                                                <Select
                                                    placeholder="Vehicle Manufacture"
                                                    options={vehicleManufactures}
                                                    labelField="name"
                                                    valueField="name"
                                                    onChange={(value) => setSelectedVehicleManufacturerName(value)}
                                                    selected={selectedVehicleManufacturerName}
                                                    isValid={!!selectedVehicleManufacturerName}
                                                />
                                            </ValidatableFormField>

                                            <ValidatableFormField fieldName="selectedVehicleBrandName" label="Brand Name *" value={selectedVehicleBrandName}>
                                                <Select
                                                    placeholder="Brand Name"
                                                    options={vehicleManufactures}
                                                    labelField="name"
                                                    valueField="name"
                                                    onChange={(value) => setSelectedVehicleBrandName(value)}
                                                    selected={selectedVehicleBrandName}
                                                    isValid={!!selectedVehicleBrandName}
                                                />
                                            </ValidatableFormField>

                                            <ValidatableFormField fieldName="selectedVehicleModel" label="Vehicle Model *" value={selectedVehicleModel?.id}>
                                                <Select
                                                    placeholder="Model Name"
                                                    options={filteredVehicleModels}
                                                    labelField="name"
                                                    valueField="id"
                                                    onChange={(value) => setSelectedVehicleModel(filteredVehicleModels.find((model) => model?.id === value))}
                                                    selected={selectedVehicleModel?.id}
                                                    isValid={!!selectedVehicleModel?.id}
                                                />
                                            </ValidatableFormField>

                                            <ValidatableFormField fieldName="vehiclePlateIdentifier" label="Vehicle Plate No *" value={vehiclePlateIdentifier}>
                                                <Input
                                                    placeholder="Vehicle Plate No"
                                                    onChange={(value) => setVehiclePlateIdentifier(value)}
                                                    value={vehiclePlateIdentifier ?? ''}
                                                    isValid={!!vehiclePlateIdentifier}
                                                    hasIndicator
                                                />
                                            </ValidatableFormField>

                                            <ValidatableFormField fieldName="selectedVehicleType" label="Vehicle Type *" value={selectedVehicleType}>
                                                <Select
                                                    placeholder="Vehicle Type"
                                                    options={vehicleTypesOptions}
                                                    onChange={(value) => setSelectedVehicleType(value)}
                                                    selected={selectedVehicleType}
                                                    isValid={!!selectedVehicleType}
                                                />
                                            </ValidatableFormField>

                                            <ValidatableFormField fieldName="selectedVehicleCategory" label="Vehicle Category *" value={selectedVehicleCategory}>
                                                <Select
                                                    placeholder="Vehicle Category"
                                                    options={vehicleCategoriesOptions}
                                                    onChange={(value) => setSelectedVehicleCategory(value)}
                                                    selected={selectedVehicleCategory}
                                                    isValid={!!selectedVehicleCategory}
                                                />
                                            </ValidatableFormField>
                                        </ValidatableForm>

                                        <FormField className="form-field full-width">
                                            <Label>Brief Description</Label>
                                            <Input
                                                placeholder="Brief description about vehicle"
                                                onChange={(value) => setVehicleDescription(value)}
                                                value={vehicleDescription ?? ''}
                                                hasIndicator
                                                isValid={true}
                                            />
                                        </FormField>
                                    </div>
                                </div>
                                <div className="section">
                                    <div className="controls">
                                        <FormField className="form-field-controls" inline>
                                            <Button className="button" title="Cancel" onClick={clearAllFields} />
                                            <Button className="button" title="Create & add Vehicle" loading={isLoadingAdd} loadingTitle="Saving..." onClick={() => { handleAddNewVehicleButtonClick() }} />
                                        </FormField>
                                    </div>

                                </div>
                            </div>
                        </Conditional>

                        <Conditional visible={selectedTabView === 'viewVehicleList'}>
                            <div className="tab-panel">
                                <Conditional visible={loadingVehiclesOfDriver}>
                                    <Loading />
                                </Conditional>
                                <Conditional visible={!loadingVehiclesOfDriver}>
                                    <div className="section vehicle-card-section">
                                        {
                                            (vehiclesOfDriver?.length == 0) ?
                                                <h4>No vehicles belongs to the driver</h4>

                                                :

                                                vehiclesOfDriver.map((vehicle) => (
                                                    <VehicleDetailsCard
                                                        uxpContext={props.uxpContext}
                                                        vehicle={vehicle}
                                                        vehicleModel={vehicleModels.find((m) => m.id === vehicle?.["Vehicle.refVehicleModel"])}
                                                        afterDeleted={handleAfterDeletingAVehicle}
                                                        driver={props.editingDriver}
                                                    />
                                                ))
                                        }
                                    </div>
                                </Conditional>

                            </div>
                        </Conditional>

                        <Conditional visible={selectedTabView === 'addExistingVehicle'}>
                            <AddExistingVehicleTabPane
                                uxpContext={props.uxpContext}
                                vehicleModels={vehicleModels}
                                onAddExistingVehicleToDriver={handleOnAddExistingVehicleToDriver}
                            />
                        </Conditional>
                    </>
                )
            }
        </Modal>
    )
}


interface IAddExistingVehicleTabPane {
    vehicleModels: IVehicleModel[],
    onAddExistingVehicleToDriver?: (vehicle: IVehicle) => Promise<any>,
    uxpContext: IContextProvider
}

const AddExistingVehicleTabPane: React.VoidFunctionComponent<IAddExistingVehicleTabPane> = (props) => {
    const toast = useToast()

    const [search, setSearch] = React.useState<string>('')
    const [message, setMessage] = React.useState<string>('')
    const [loading, setLoading] = React.useState<boolean>(false)
    const [foundVehicle, setFoundVehicle] = React.useState<IVehicle>()

    const handleOnSearch = async () => {
        try {
            setLoading(true)
            const vehicle = await findVehicleDetailsByVehiclePlateIdentifier(search, props.uxpContext)
            setFoundVehicle(vehicle);
        } catch (error) {
            console.log(error)
            setMessage(`Cannot find the vehicle with plate identifier ${search}.`);
            setFoundVehicle(null);
        } finally {
            setLoading(false)
        }
    }

    const vehicleModel = React.useMemo(() => {
        if (!foundVehicle) return;
        return props.vehicleModels.find((model) => model.id === foundVehicle["Vehicle.refVehicleModel"])
    }, [foundVehicle?.id])

    const handleAddVehicle = async () => {
        setLoading(true)
        await props.onAddExistingVehicleToDriver(foundVehicle)
        setLoading(false)
    }

    return (
        <div className="tab-panel">
            <div className="section">
                <div className="search-control-panel">
                    <FormField className="search-form-field">
                        <Input
                            className="search-input"
                            value={search}
                            onChange={(value) => { setSearch(value); setMessage('') }}
                            placeholder={'Vehicle Plate No'}
                        />
                        <Button className="search-button" title={''} icon={searchIcon} onClick={() => {
                            handleOnSearch()
                        }} />
                    </FormField>
                </div>
                <Conditional visible={loading}>
                    <Loading />
                </Conditional>
                <Conditional visible={!loading}>
                    {
                        !!foundVehicle ? (
                            <div className="vehicle-details-panel">

                                <table>
                                    <tbody>
                                        <tr><td>Vehicle ID</td><td>{foundVehicle.id}</td></tr>
                                        <tr><td>Plate Identifier</td><td>{foundVehicle["Vehicle.vehiclePlateIdentifier"]}</td></tr>
                                        <tr><td>Vehicle Type</td><td>{foundVehicle["Vehicle.vehicleType"]}</td></tr>
                                        <tr><td>Category</td><td>{foundVehicle["Vehicle.category"]}</td></tr>
                                        <tr><td>Brand Name</td><td>{vehicleModel?.brandName}</td></tr>
                                        <tr><td>Manufacturer Name</td><td>{vehicleModel?.manufacturerName}</td></tr>
                                        <tr><td>Width</td><td>{vehicleModel?.width}</td></tr>
                                        <tr><td>Height</td><td>{vehicleModel?.height}</td></tr>
                                    </tbody>
                                </table>
                                <div className="controls">
                                    <FormField className="form-field-controls" inline>
                                        <Button
                                            className="button"
                                            title="Add Vehicle"
                                            loading={loading}
                                            loadingTitle="Saving..."
                                            onClick={() => { handleAddVehicle() }} />
                                    </FormField>
                                </div>
                            </div>
                        ) : (
                            <Conditional visible={!!message}>
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <h4> {message} </h4>
                                </div>
                            </Conditional>

                        )
                    }
                </Conditional>

            </div>
        </div>
    )
}
interface IVehicleDetailsCardProps {
    vehicle: IVehicle,
    vehicleModel: IVehicleModel,
    uxpContext: IContextProvider,
    driver: IDriver,
    afterDeleted?: () => Promise<any>
}

const VehicleDetailsCard: React.VoidFunctionComponent<IVehicleDetailsCardProps> = ({ vehicle, afterDeleted, vehicleModel, uxpContext, driver }) => {

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [deleteItem, setDeleteItem] = useState<any>(false)
    const toast = useToast();

    const onDelete = async () => {
        setIsLoading(true);
        const updatedDriverList = vehicle?.driverIds.filter((id) => id !== driver?.id);

        try {
            if (updatedDriverList.length === 0) {
                await removeVehicle(vehicle?.id, uxpContext);
            } else {
                await updateDriverListOfExistingVehicle(vehicle?.id, updatedDriverList, uxpContext)
            }

            afterDeleted && await afterDeleted();
        } catch (error) {
            toast.error('Something went wrong while deleting the vehicle...')
        } finally {
            setIsLoading(false);
        }

    };


    return (
        <div className="vehicle-card-wrapper">
            <div className="vehicle-card">
                <div className="title">
                    <div className="info" style={{ fontWeight: 600 }}>{vehicle["Vehicle.vehiclePlateIdentifier"]}</div>
                    <div className="info" style={{ fontSize: '10px' }}>{vehicleModel?.name}</div>
                    <div className="info" style={{ fontSize: '10px' }}>{vehicleModel?.brandName}</div>
                </div>
                <div className="body">
                    {
                        isLoading ? <Loading /> :
                            <>
                                <Tooltip content="Remove this vehicle from driver" position='bottom'>
                                    <Button
                                        disabled={isLoading}
                                        className="button only-icon-button"
                                        title=""
                                        icon={deleteIcon}
                                        onClick={() => { setDeleteItem(true) }} />
                                </Tooltip>

                                <Tooltip
                                    content={() => (<VehicleInformations vehicle={vehicle} vehicleModel={vehicleModel} />)}
                                    position='right'>
                                    <Button
                                        disabled={isLoading}
                                        className="button only-icon-button"
                                        title=""
                                        icon={infoIcon}
                                        onClick={() => { }} />
                                </Tooltip>
                            </>
                    }
                </div>
            </div>

            <ConfirmPopup
                show={deleteItem}
                onConfirm={{
                    execute: () => onDelete(),
                    onComplete: () => {
                    },
                    onError: (e) => {
                    }
                }}
                onCancel={() => setDeleteItem(false)}
                message={`Do you really wand to remove this vehicle from driver?`}
                processingMessage={`Removing vehicle...`}
            />
        </div>
    )
}

const VehicleInformations: React.VoidFunctionComponent<{ vehicle: IVehicle, vehicleModel: IVehicleModel }> = ({ vehicle, vehicleModel }) => {

    const fieldNameMapper: { [key: string]: string } = {
        "Vehicle.vehiclePlateIdentifier": 'Vehicle No',
        "Vehicle.vehicleType": 'Vehicle Type',
        "Vehicle.category": 'Vehicle Category',
        "brandName": 'Brand Name',
        "manufacturerName": 'Manufacturer',
        "modelName": 'Model Name',
        'height': 'Height',
        'width': 'Width',
    }

    return (
        <ItemListCard
            className="vehicle-information-card"
            title="Vehicle Informations"
            item={{ ...vehicleModel, ...vehicle }}
            fields={[
                "Vehicle.vehiclePlateIdentifier",
                "Vehicle.vehicleType",
                "Vehicle.category",
                "brandName",
                "manufacturerName",
                "modelName",
                "height",
                "width"
            ]}
            renderField={(item, field, key) => {
                return (
                    <div className="vehicle-field" key={key}>
                        <div className="label">{fieldNameMapper[field]}</div>
                        <div className="value"> {item[field]}</div>
                    </div>
                )
            }}
            backgroundColor="rgb(255 255 255)"
        />)
}


export default VehicleDetailsModal