import React, { useEffect, useState } from "react";
import { Button, FormField, IOption, Loading, Modal, MultiSelect, Select, useToast } from "uxp/components";
import { handleErrorResponse, handleSuccessResponse } from "../../utils";
import { IContextProvider } from "../../uxp";
import { Conditional } from "../common/ConditionalComponent";
import { ValidatableForm, ValidatableFormField } from "../common/ValidatableForm";
import { fetchParkingGroups, IParkingGroup } from "../ParkingInformation/ParkingGroup";
import { fetchAllDrivers, IDriver } from "../Drivers/Drivers";
import removeIcon from "../../assets/images/close-circle-outline.svg"
import addIcon from "../../assets/images/plus-circle.svg"
import { fetchAllUsers, IUser } from "../Users/User";


interface ISpecialPermitsModalProps {
    uxpContext: IContextProvider,
    show: boolean,
    onClose?: () => any,
    afterSave?: () => any,
}

interface ISpecialPermits {
    id: string, 
    name: string,
}


async function fetchSpecialPermits(uxpContext: IContextProvider): Promise<ISpecialPermits[]> {
    try {
        console.log('Fetching all drivers');

        const result = await uxpContext.executeAction('SpecialPermits', 'specialPermitsAll', {}, { json: true });

        return result.data as ISpecialPermits[];

    } catch (err) { console.error(err); throw err; }
}

const SpecialPermitsModal: React.VoidFunctionComponent<ISpecialPermitsModalProps> = (props) => {

    const toast = useToast();

    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    const [selectedTabView, setSelectedTabView] = useState("assignParkingGroup");

    const [parkingGroups, setParkingGroups] = useState<IParkingGroup[]>([]);
    const [drivers, setDrivers] = useState<IDriver[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [driverOption, setDriverOption] = useState<IOption[]>([]);

    const [selectedParkingGroup, setSelectedParkingGroup] = useState<string>("");
    const [selectedSpecialPermits, setSelectedSpecialPermits] = useState<string[]>([]);
    const [driverSpecialPermits, setDriverSpecialPermits] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState("");

    const handleCancelButtonClick = () => {
        props.onClose();
    }

    const handleAssignToParkingGroup = () => {
        props.uxpContext.executeAction("ParkingGroup", "parkingGroupSpecialPermitsUpdate", { id: selectedParkingGroup, specialPermits: selectedSpecialPermits }, { json: true })
            .then(res => {
                console.log("Response ", res);
                let { valid, data } = handleSuccessResponse(res, 101401)
                if (valid) {
                    let newParkingGroups = [...parkingGroups]
                    let index = newParkingGroups.findIndex(d => d["ParkingGroup.id"] === selectedParkingGroup);
                    newParkingGroups[index]["ParkingGroup.specialPermits"] = selectedSpecialPermits;
                    setParkingGroups(newParkingGroups);
                    toast.success("Assigned Special permits to Parking Group")
                    return
                }
                toast.error("Invalid Response")
            })
            .catch(e => {
                let { valid, msg } = handleErrorResponse(e, {
                    101402: [
                        { error: "ERR_PARKING_GROUP_NOT_FOUND", message: "Unable to find parking group. Something went wrong" },
                        { error: "ERR_INVALID_SPECIAL_PERMIT_LIST", message: "Unable to invalid special permits. Something went wrong" },
                        { error: "ERR_UPDATING_PARKING_GROUP", message: "Unable to assign special permits. Something went wrong" },
                    ]
                })
                toast.error(msg)
            }).finally(() => {
                clearAllFields();
            })
    }

    const handleAssignToDriver = () => {
        props.uxpContext.executeAction("Driver", "driversSpecialPermitsUpdate", { id: selectedDriver, specialPermits: driverSpecialPermits }, { json: true })
            .then(res => {
                console.log("Response ", res);
                let { valid, data } = handleSuccessResponse(res, 101301)
                if (valid) {
                    let newDrivers = [...drivers]
                    let index = newDrivers.findIndex(d => d.id === selectedDriver);
                    newDrivers[index]["Driver.specialPermits"] = driverSpecialPermits;
                    setDrivers(newDrivers);
                    toast.success("Assigned Special permits to Driver")
                    return
                }
                toast.error("Invalid Response")
            })
            .catch(e => {
                let { valid, msg } = handleErrorResponse(e, {
                    101302: [
                        { error: "ERR_DRIVER_NOT_FOUND", message: "Unable to find driver. Something went wrong" },
                        { error: "ERR_INVALID_SPECIAL_PERMIT_LIST", message: "Unable to invalid special permits. Something went wrong" },
                        { error: "ERR_UPDATING_DRIVER", message: "Unable to assign special permits. Something went wrong" },
                    ]
                })
                toast.error(msg)
            }).finally(() => {
                clearAllFields();
            })
    }

    useEffect(() => {
        Promise.all([
            fetchAllUsers(props.uxpContext),
            fetchAllDrivers(props.uxpContext),
            fetchParkingGroups(props.uxpContext)
        ]).then(result => {
            const [users, drivers, parkingGroup] = result;
            setUsers(users);
            setParkingGroups(parkingGroup);
            setDrivers(drivers);
            setIsLoading(false)
        }).catch(error => {
            toast.error('Error while fetching details. Please refresh...');
        })
    }, [])

    React.useLayoutEffect(() => {
        clearAllFields();
        setSelectedTabView("assignParkingGroup")
    }, [props.show])

    const clearAllFields = () => {
        setSelectedParkingGroup("");
        setSelectedSpecialPermits([]);
        setSelectedDriver("");
    }

    useEffect(() => {
        const driverOptions = drivers.map(d => {
            let user = users.find(u => u["UserKey"] == d["Driver.userId"])
            return {label: user.FullName, value: d.id}
        })

        setDriverOption(driverOptions)
    }, [users, drivers])

    useEffect(() => {
        let driver = drivers.find(d => d.id === selectedDriver);
        setDriverSpecialPermits(driver?.["Driver.specialPermits"] ? driver["Driver.specialPermits"] : []);
    }, [selectedDriver])

    useEffect(() => {
        let parkingGroup = parkingGroups.find(d => d["ParkingGroup.id"] === selectedParkingGroup);
        setSelectedSpecialPermits(parkingGroup?.["ParkingGroup.specialPermits"] ? parkingGroup["ParkingGroup.specialPermits"] : []);
    }, [selectedParkingGroup])

    return (
        <Modal
            className="special-permits-modal"
            show={props.show}
            title={`Assign Special Permits`}
            onClose={() => { handleCancelButtonClick() }}>
            {
                isLoading ? (
                    <div className="loading-text">
                        <Loading />
                        <span style={{ marginTop: '20px' }}>Loading special Permits</span>
                    </div>
                ) : (

                    <>
                        <div className="tab-control-bar">
                            <Button
                                active={selectedTabView === 'assignParkingGroup'}
                                className="tab-control-button"
                                title={'Assign to Parking Group'}
                                onClick={() => setSelectedTabView('assignParkingGroup')} />

                            <Button
                                active={selectedTabView === 'assignToDriver'}
                                className="tab-control-button"
                                title={'Assign to Driver'}
                                onClick={() => setSelectedTabView('assignToDriver')} />

                        </div>

                        <Conditional visible={selectedTabView === "assignParkingGroup"} >
                            <div className="tab-panel">
                                <div className="section">
                                    <div className="form-field-group">
                                        <ParkingGroupToSpecialPermitsForm
                                            uxpContext={props.uxpContext}
                                            selectedParkingGroup={selectedParkingGroup}
                                            selectedSpecialPermits={selectedSpecialPermits}
                                            onChange={({parkingGroup, specialPermits}) => { 
                                                setSelectedParkingGroup(parkingGroup);
                                                setSelectedSpecialPermits(specialPermits)
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="section">
                                    <div className="controls">
                                        <FormField className="form-field-controls" inline>
                                            <Button className="button" title="Cancel" onClick={() => {  handleCancelButtonClick() }} />
                                            <Button className="button" title="Save" loading={false} loadingTitle="Saving..." onClick={() => { handleAssignToParkingGroup() }} />
                                        </FormField>
                                    </div>
                                </div>
                            </div>
                        </Conditional>

                        <Conditional visible={selectedTabView === 'assignToDriver'}>
                            <div className="tab-panel">
                                <div className="section">
                                    <div className="title">Driver</div>
                                    <div className="driver-select">
                                        <Select options={driverOption} onChange={(value) => {
                                            setSelectedDriver(value)
                                        }} selected={selectedDriver} />
                                    </div>
                                </div>
                                <Conditional visible={!!selectedDriver} >

                                <div className="section">
                                    <div className="title">Special permits</div>
                                    {
                                        driverSpecialPermits.map((sp, index) => {
                                            
                                            return <div className="form-field-group" key={index}>
                                            <ParkingGroupToSpecialPermitsForm
                                                uxpContext={props.uxpContext}
                                                selectedParkingGroup={sp[0]}
                                                selectedSpecialPermits={sp[1]}
                                                onChange={({parkingGroup, specialPermits}) => {
                                                    let spIndex = driverSpecialPermits.findIndex(p => p[0] == parkingGroup);

                                                    if(spIndex !== -1 && spIndex !== index){
                                                        toast.error(`This parkingGroup is already selected.`);
                                                        return;
                                                    } 

                                                    let newSpecialPermits = [...driverSpecialPermits];
                                                    newSpecialPermits[index] = [parkingGroup, specialPermits]
                                                    setDriverSpecialPermits(newSpecialPermits); 
                                                }}
                                                />
                                            <div className="remove-button">
                                                <Button icon={removeIcon} title="Remove" onClick={() => {
                                                    let newSpecialPermits = [...driverSpecialPermits];
                                                    newSpecialPermits.splice(index, 1);
                                                    setDriverSpecialPermits(newSpecialPermits); 
                                                }} />
                                            </div>
                                        </div>
                                        })
                                    }
                                    <Button className="add-button" title="Add" icon={addIcon} onClick={() => { setDriverSpecialPermits(v => [...v, ["", []]]) }} />
                                </div>
                                <div className="section">
                                    <div className="controls">
                                        <FormField className="form-field-controls" inline>
                                            <Button className="button" title="Cancel" onClick={() => { handleCancelButtonClick() }} />
                                            <Button className="button" title="Save" loading={false} loadingTitle="Saving..." onClick={() => { handleAssignToDriver() }} />
                                        </FormField>
                                    </div>

                                </div>
                                </Conditional>
                            </div>
                        </Conditional>
                    </>
                )
            }
        </Modal>
    )
}


export default SpecialPermitsModal

interface ParkingGroupToSpecialPermits {
    parkingGroup: string;
    specialPermits: string[];
}

interface IParkingGroupToSpecialPermitsFormProps {
    selectedParkingGroup: string;
    selectedSpecialPermits: string[];
    onChange: (value: ParkingGroupToSpecialPermits) => void;
    uxpContext: IContextProvider;
}

const ParkingGroupToSpecialPermitsForm: React.FunctionComponent<IParkingGroupToSpecialPermitsFormProps> = (props) => {
    const { uxpContext, selectedParkingGroup, selectedSpecialPermits, onChange } = props
    const [parkingGroupOptions, setParkingGroupOptions] = useState<IOption[]>([]);
    const [specialPermitsOptions, setSpecialPermitsOptions] = useState<IOption[]>([]);

    const toast = useToast();
    
    useEffect(() => {
        Promise.all([
            fetchParkingGroups(uxpContext),
            fetchSpecialPermits(uxpContext)
        ]).then(result => {
            const [parkingGroups, specialPermits] = result;
            setParkingGroupOptions(parkingGroups.map(p => ({label: p["ParkingGroup.name"], value: p["ParkingGroup.id"]})));
            setSpecialPermitsOptions(specialPermits.map(s => ({label: s["name"], value: s["name"]})));
        }).catch(error => {
            toast.error('Error while fetching details. Please refresh...');
        })
    }, [])

    return <>
            <ValidatableForm
                validateSchema={{
                    selectedParkingGroup: { fieldName: 'selectedParkingGroup', label: 'Parking Group', validatorCollection: ['isRequired'] },
                    selectedSpecialPermits: { fieldName: 'selectedSpecialPermits', label: 'Special Permits', validatorCollection: ['isRequired'] }
                }}
            >
                <ValidatableFormField fieldName="parkingGroup" label="Parking Group *" value={selectedParkingGroup}>
                    <Select
                        placeholder="Parking Group"
                        options={parkingGroupOptions}
                        onChange={(value) => onChange({ parkingGroup: value, specialPermits: selectedSpecialPermits })}
                        selected={selectedParkingGroup}
                        isValid={!!selectedParkingGroup}
                    />
                </ValidatableFormField>

                <Conditional visible={!!selectedParkingGroup}>


                <ValidatableFormField fieldName="permits" label="Special Permits *" value={selectedSpecialPermits}>
                    <MultiSelect
                        placeholder="Special Permits"
                        options={specialPermitsOptions}
                        onChange={(value) => onChange({ parkingGroup: selectedParkingGroup, specialPermits: value })}
                        selected={selectedSpecialPermits}
                        isValid={!!selectedSpecialPermits}
                        />
                </ValidatableFormField>
                </Conditional>
            </ValidatableForm>
        </>
}