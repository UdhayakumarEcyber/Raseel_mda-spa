import * as React from 'react'
import { Button, Checkbox, DataTable, DateTimePicker, FormField, IconButton, IDataFunction, IDataTableColumn, Input, Label, SearchBox, Select, useToast } from 'uxp/components';
import { handleErrorResponse, handleSuccessResponse } from '../../utils';
import { IContextProvider } from '../../uxp'
import BreadCrumb from '../common/BreadCrumb';
import { Conditional } from '../common/ConditionalComponent';
import { ValidatableForm, ValidatableFormField, ValidatableFormRef } from '../common/ValidatableForm';

import filterIcon from '../../assets/images/filter.svg'
import { fetchAllVehicles, IVehicle } from '../Drivers/VehicleDetailsModal';

interface IParkingRecordsProps {
    uxpContext: IContextProvider,
}

interface IParkingRecordsFilterFormData {
    'Vehicle.vehiclePlateIdentifier': string,
    dateFrom: Date,
    dateTo: Date
}

const getParkingRecordsByWhichIncludesASearch = (search: string, records: []) => {
    return records.filter((record) => {
        return Object.values(record).findIndex((value) => {
            if (typeof (value) !== 'string') return false;
            return value?.toLowerCase().includes(search?.toLowerCase() ?? '')
        }) !== -1
    })
}

const ParkingRecords: React.VoidFunctionComponent<IParkingRecordsProps> = ({ uxpContext }) => {
    const toast = useToast();

    const yesterday = React.useMemo(() => {
        let dateTo = new Date();
        dateTo.setDate(dateTo.getDate() - 1)
        return dateTo
    }, [])

    const formRef = React.useRef<ValidatableFormRef>();
    const [filterData, setFilterData] = React.useState<IParkingRecordsFilterFormData>({
        'Vehicle.vehiclePlateIdentifier': '',
        dateFrom: yesterday,
        dateTo: new Date()
    });

    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [filterCount, setFilterCount] = React.useState<number>(0);
    const [search, setSearch] = React.useState<string>();
    const [vehicleOptions, setVehicleOptions] = React.useState<IVehicle[]>([]);

    React.useEffect(() => {
        fetchAllVehicles(uxpContext)
            .then(res =>{ 
                console.log(res)
                setVehicleOptions(res)})
            .catch(err => toast.error("Unable to load Vehicles"))
    }, [])

    const [isFiltersEnabled, setIsFiltersEnabled] = React.useState<boolean>(false);

    let getParkingRecordsDataOnFilterButtonClick = React.useCallback((max: number, last: string) => (
        new Promise<{ items: any[], pageToken: string }>((resolve) => {
            setIsLoading(true);

            // Manually set a large date range when date filtering disabled than changing backend
            let filters : IParkingRecordsFilterFormData = {...filterData};
            if(!isFiltersEnabled) {
                filters.dateFrom = new Date('2022-01-01')
                filters.dateTo = new Date()
            }

            uxpContext.executeAction('Parking', 'ParkingHistoryOfVehicle', { max, last, ...filters }, { json: true })
                .then(res => {
                    let { valid, data } = handleSuccessResponse(res, 102401)

                    if (valid && data) {
                        let filteredData = getParkingRecordsByWhichIncludesASearch(search, data)
                        let pageToken = last;
                        if (filteredData.length > 0) pageToken = filteredData[filteredData.length - 1]['bookingId'];
                        resolve({ items: filteredData, pageToken });
                    }
                    else {
                        toast.error('Invalid Response')
                    }
                }).catch(e => {
                    let { msg } = handleErrorResponse(e, {
                        102402: [
                            { error: 'ERR_FETCHING_PARKING_RECORDS_HISTORY', message: 'Something went wrong while fetching parking records...' },
                            { error: 'ERR_VEHICLE_PLATE_IDENTIFIER_IS_EMPTY', message: 'Error occured... Vehicle plate identifier is empty.' },
                            { error: 'ERR_VEHICLE_PLATE_IDENTIFIER_IS_INVALID', message: 'Error occured... Vehicle plate identifier is invalid.' },
                            { error: 'ERR_DATE_FROM_FILTER_IS_EMPTY', message: 'Error occured... Filter start date is not provided.' },
                            { error: 'ERR_DATE_TO_FILTER_IS_EMPTY', message: 'Error occured... Filter end date is not provided.' },
                            { error: 'ERR_DATE_FROM_FILTER_IS_INVALID', message: 'Error occured... Filter start date is invalid.' },
                            { error: 'ERR_DATE_TO_FILTER_IS_INVALID', message: 'Error occured... Filter end date is invalid.' },
                            { error: 'ERR_DATE_FROM_MUST_BE_AN_EARLIER_OR_EQUAL_DATE_THAN_DATE_TO', message: 'Error occured... Start date must be earlier or equal to end date' },
                        ]
                    })
                    resolve({ items: [], pageToken: last })
                    toast.error(msg)
                }).finally(() => {
                    setIsLoading(false);
                })
        })
    ), [filterCount]);

    let memorizedColumns = React.useMemo<IDataTableColumn[]>(() => (
        [
            {
                title: 'Booking ID',
                width: '',
                renderColumn: (item) => <div style={{ fontSize: '10px', fontWeight: '600' }}>{item.bookingId}</div>
            },
            {
                title: 'Vehicle Plate #',
                width: '',
                renderColumn: (item) => <div>{item.vehiclePlateIdentifier}</div>
            },
            {
                title: 'Parking Site',
                width: '',
                renderColumn: (item) => <div style={{ textAlign: 'center' }}>{item.parkingSiteName}</div>
            },
            {
                title: 'Parking Group',
                width: '',
                renderColumn: (item) => <div style={{ textAlign: 'center' }}>{item.parkingGroupName}</div>
            },
            {
                title: 'Parking Spot',
                width: '',
                renderColumn: (item) => <div style={{ textAlign: 'center' }}>{item.parkingSpotName}</div>
            },
            {
                title: 'Check In Time',
                width: '',
                renderColumn: (item) => {
                    let date = new Date(item.checkinTimestamp).toLocaleString();

                    return <div>{date !== 'Invalid Date' ? date : '-'}</div>;
                }
            },
            {
                title: 'Check Out Time',
                width: '',
                renderColumn: (item) => {
                    let date = new Date(item.checkoutTimestamp).toLocaleString();

                    return <div>{date !== 'Invalid Date' ? date : '-'}</div>;
                }
            },
            {
                title: 'Amount Charged',
                width: '',
                renderColumn: (item) => {
                    if (typeof (item.chargesPaid) === 'string') {
                        return <div>{item.chargesPaid}</div>
                    }

                    if (typeof (item.chargesPaid) === 'object') {
                        return <div>{`${item.chargesPaid?.currency}.${item.chargesPaid?.amount}`}</div>
                    }

                    return <div>N/A</div>
                }
            }
        ]
    ), [])

    const handleOnClickFilterButton = () => {
        // cancel if there are errors return
        const errors = formRef.current?.validateFields(true);
        if (Object.keys(errors).length > 0) return;
        setFilterCount(filterCount + 1);
    }

    const handleOnClickSearch = handleOnClickFilterButton;

    return (
        <div className="page-content">
            <div className="parking-records-page">

                <BreadCrumb />

                <div className="section" id="parking-spot-section">
                    <h3 className="title">Booking Records</h3>

                    <div className="filters-section">
                        <Label className="label">Enable Date Filters</Label>
                        <Checkbox onChange={setIsFiltersEnabled} type={'switch-line'} checked={isFiltersEnabled}/>
                    </div>
                    
                    <div className="form-field-group">
                        <ValidatableForm
                            validateSchema={{
                                'Vehicle.vehiclePlateIdentifier': { fieldName: 'Vehicle.vehiclePlateIdentifier', label: 'Vehicle plate #', validatorCollection: ['isRequired'] },
                                'dateFrom': { fieldName: 'dateFrom', label: 'Start date & time', validatorCollection: isFiltersEnabled ? ['isRequired']: [] },
                                'dateTo': { fieldName: 'dateTo', label: 'End date & time', validatorCollection: isFiltersEnabled ? ['isRequired']: [] },
                            }}
                            ref={formRef}>

                            <ValidatableFormField className="vehicle-name-field" fieldName="Vehicle.vehiclePlateIdentifier" label="Vehicle plate #" value={filterData?.['Vehicle.vehiclePlateIdentifier']}>
                                <Select
                                    placeholder="Vehicle plate #"
                                    onChange={(value) => { setFilterData({ ...filterData, ['Vehicle.vehiclePlateIdentifier']: value }) }}
                                    selected={filterData?.['Vehicle.vehiclePlateIdentifier'] ?? ''}
                                    isValid={!!filterData?.['Vehicle.vehiclePlateIdentifier']}
                                    options={vehicleOptions}
                                    valueField={"Vehicle.vehiclePlateIdentifier"}
                                    labelField={"Vehicle.vehiclePlateIdentifier"}
                                // hasIndicator
                                />
                            </ValidatableFormField>

                            <Conditional visible={isFiltersEnabled}>
                                
                                <ValidatableFormField className="date-field" fieldName="dateFrom" label="Start date time" value={!!filterData?.dateFrom}>
                                    <DateTimePicker
                                        disableInput={!isFiltersEnabled}
                                        title="Start date & time"
                                        onChange={(value) => { setFilterData({ ...filterData, dateFrom: value }) }}
                                        datetime={filterData?.dateFrom ?? null}
                                    />
                                </ValidatableFormField>

                                <ValidatableFormField className="date-field" fieldName="dateTo" label="End date time" value={!!filterData?.dateTo}>
                                    <DateTimePicker
                                        disableInput={!isFiltersEnabled}
                                        title="End date & time"
                                        onChange={(value) => { setFilterData({ ...filterData, dateTo: value }) }}
                                        datetime={filterData?.dateTo ?? null}
                                    />
                                </ValidatableFormField>

                            </Conditional>
                        </ValidatableForm>
                    </div>

                    <div className="control-panel" id="modal-control-panel">
                        <div className="control-panel-field">
                            <Button
                                title="Filter Booking Records"
                                icon={filterIcon}
                                className="button"
                                loading={isLoading}
                                loadingTitle="Fetching Data..."
                                onClick={handleOnClickFilterButton} />
                        </div>
                    </div>
                </div>

                <Conditional visible={!!filterCount}>
                    <div className="table-section">
                        <div className="search-panel">
                            <FormField className="search-form" inline>
                                <Input
                                    value={search ?? ''}
                                    placeholder="Search Records"
                                    onChange={(newValue) => { setSearch(newValue) }}
                                />
                                <IconButton className="search-button" type={'search'} onClick={handleOnClickSearch} />
                            </FormField>
                        </div>

                        <DataTable
                            className="parking-records-table"
                            data={getParkingRecordsDataOnFilterButtonClick}
                            pageSize={50}
                            columns={memorizedColumns}
                            activeClass="active"
                        />
                    </div>
                </Conditional>

            </div>
        </div>
    )
}

export default ParkingRecords;