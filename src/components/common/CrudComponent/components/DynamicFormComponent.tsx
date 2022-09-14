import { format } from 'date-fns';
import { map } from 'leaflet';
import * as React from 'react';
import { FormField, Label, Checkbox, Input, Select, DatePicker, TimePicker, FormFeedback, NotificationBlock } from 'uxp/components';
import { IDynamicFormComponentProps } from '../../../../../crud-component';
import { Conditional } from '../../ConditionalComponent';
import FileUploader from '../../FileUploader/FileUploader';
import FormError from '../../FormError';
import Readonly from '../../Readonly';
import { LocationPicker } from './LocationPicker';

export interface IFormData {
    [key: string]: any
}

const DynamicFormComponent: React.FunctionComponent<IDynamicFormComponentProps> = (props) => {
    // refs & state
    const myRefs = React.useRef([]);
    const [formData, setFormData] = React.useState<{ [key: string]: any }>({})
    const [isDataLoaded, setIsDataLoaded] = React.useState(false);
    let [formErrors, setFormErrors] = React.useState<any>({})
    let [processing, setProcessing] = React.useState(false)
    let [saving, setSaving] = React.useState(false)


    // component did mount 
    // pass second argument as [] to run only once
    React.useEffect(() => {
        updateFormDataWithDefaults();
    }, [props.formStructure])

    React.useEffect(() => {
        // console.log("data ", formData)

        if (!isDataLoaded && Object.keys(formData).length > 0) {
            setIsDataLoaded(true);
            // console.log("data ", formData)
        }
    }, [formData])

    // update state by defaults
    const updateFormDataWithDefaults = () => {
        let newData = {};
        props.formStructure.map((formField: any) => {
            let type = formField.type || ""
            let value = formField.value;
            switch (type) {
                case "checkbox":
                case "toggle":
                    // console.log(type, value)
                    if (!value) { value = false }
                    else if (typeof value != 'boolean') { value = !!value } // string 'false' will return true
                    break;
                case "number":
                    if (!value) { value = 0 }
                    else if (typeof value != 'number') {
                        // assume float value is provided 
                        let float = parseFloat(value)
                        value = isNaN(float) ? 0 : float
                    }
                    break;
                case "map":
                    if (!value) value = null
                    break;
                case "attachment":
                    if (!value) value = null
                default:
                    if (!value) value = ""
                    break;
            }
            Object.assign(newData, { [formField.name]: value })
        })

        setFormData(newData);
    }

    // submit event
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        submit()
    }

    async function submit() {
        setProcessing(true)
        setSaving(false)
        // validate form 
        let errors: any = {}
        let isValidForm = true
        for (let field of props.formStructure) {
            let key = field.name
            let val = formData[key]

            let { valid, error } = validateField(key, val)
            if (!valid) {
                errors[key] = error
                isValidForm = false
            }
        }

        if (isValidForm) {
            setFormErrors({})
            props.onSubmit(formatData(formData))
                .then(res => {
                    setProcessing(false)
                })
                .catch(e => {
                    setProcessing(false)
                })
        }
        else {
            setFormErrors(errors)
            setProcessing(false)
        }
    }

    const formatData = (obj: any) => {
        const keys = Object.keys(obj);
        const formatedObject: any = {};
        keys.forEach((key: string) => {
            let value = obj[key]
            if (typeof value == "object") {
                value = JSON.stringify(value);
            }
            formatedObject[key] = value
        })

        return formatedObject;
    }


    const handleCancel = () => {
        if (typeof props.onCancel != "undefined") {
            props.onCancel();
        }
    }

    // change event
    const handleChange = (value: string | number | boolean, key: string) => {

        let { onChange } = props;

        let newData = { [key]: value };

        let newFormData = { ...formData, ...newData };
        if (onChange) {
            newFormData = onChange(formData, newFormData);
        }
        setFormData(newFormData);

        let { valid, error } = validateField(key, value)
        // remove erros if valid 
        if (valid) setFormErrors((prev: any) => {
            delete prev[key]
            return prev
        })
        // add if not
        else setFormErrors((prev: any) => ({ ...prev, [key]: error }))


    }

    function validateField(key: string, value: string | number | boolean): { valid: boolean, error?: string } {
        let formStructure = [...props.formStructure]
        let field = formStructure.find(f => f.name == key)
        let validator = field.validate

        if (!validator) return { valid: true }

        let { required, allowEmptyString, minLength, maxLength, regExp, allowZeros, minVal, maxVal, customValidateFunction } = validator

        if (customValidateFunction) return customValidateFunction(value)
        if (required) {
            if (!value) return { valid: false, error: `${field.label} is required` }
            let type = typeof value

            if (type == 'string') {
                if (!allowEmptyString && (value as string).trim().length == 0) return { valid: false, error: `${field.label} is required` }

                if (minLength) {
                    if ((value as string).trim().length < minLength) return { valid: false, error: `Minimum ${minLength} characters required` }
                }

                if (maxLength) {
                    if ((value as string).trim().length > maxLength) return { valid: false, error: `Maximum ${maxLength} characters allowed` }
                }

                
            }
            if (type == 'number') {
                if (!allowZeros && value == 0) return { valid: false, error: 'Value must be grater than 0' }
                if (minVal && value < minVal) return { valid: false, error: `Value must be grater than or equal to ${minVal}` }
                if (maxVal && value > maxVal) return { valid: false, error: `Value must be less than or equal to ${minVal}` }
            }
            
        }
        if (value && regExp && !regExp.test(value as string)) return { valid: false, error: 'Invalid value' }
        
        return { valid: true }
    }

    function isValid(key: string, value: any) {
        let { valid } = validateField(key, value)
        return valid
    }
    const generateForm = () => {
        let formStructure = props.formStructure;

        let formFields = formStructure.map((formField: any) => {

            let { name, type, label, validate, location, ...rest } = formField
            let required = validate?.required || null
            let placeholder = formField.placeholder || ""
            let options = formField.options || []
            let value = formData[name]
            let valueField = formField.valueField || undefined
            let labelField = formField.labelField || undefined
            let buttonLabel = formField.buttonLabel || "Add"
            let disable = formField.disable
            let uxpContext = formField?.attachment?.uxpContext;
            let attachmentButtonLabel = formField?.attachment?.buttonLabel;
            let displayValue = formField?.displayValue || null;
            let calculateValue = formField?.calculateValue
            
            let regions = location?.regions || { type: "Polygon", coordinates: null }
            let regionsName = location?.regionsName || ""
            let locationTitle = location?.locationTitle || ""
            let mapType = location?.mapType;
            let zoom = location?.zoom || 14;
            let setZoom = location?.setZoom;

            if (type) {
                switch (formField.type) {
                    case "checkbox":
                    case "toggle":
                        return <FormField key={name}>
                            {/* <Label>{`${label} ${required ? "*": "" }`  }</Label> */}

                            <Checkbox
                                checked={value}
                                onChange={val => handleChange(val, name)}
                                label={`${label} ${required ? "*" : ""}`}
                                type={type == "checkbox" ? "bordered" : "switch-line"}
                                isValid={isValid(name, value)}
                            />
                            <FormError formErrors={formErrors} field={name} />
                        </FormField>
                    case "number":
                        return <FormField key={name}>
                            <Label>{`${label} ${required ? "*" : ""}`}</Label>
                            <Input
                                value={value}
                                onChange={val => {
                                    let float = parseFloat(val)
                                    handleChange(isNaN(float) ? 0 : float, name)
                                }}
                                placeholder={placeholder}
                                inputAttr={{ "disabled": disable }}
                                isValid={isValid(name, value)}
                                hasIndicator
                            />
                            <FormError formErrors={formErrors} field={name} />
                        </FormField>
                    case "select":
                        return <FormField key={name}>
                            <Label>{`${label} ${required ? "*" : ""}`}</Label>
                            <Select
                                options={options}
                                selected={value}
                                onChange={val => handleChange(val, name)}
                                placeholder={placeholder}
                                valueField={valueField}
                                labelField={labelField}
                                isValid={isValid(name, value)}
                            />
                            <FormError formErrors={formErrors} field={name} />
                        </FormField>
                    case "date":
                        return <FormField key={name}>
                            <Label>{`${label} ${required ? "*" : ""}`}</Label>
                            <DatePicker
                                title={""}
                                date={value}
                                onChange={val => handleChange(format(val, "yyyy/MM/dd"), name)}
                            />
                            <FormError formErrors={formErrors} field={name} />
                        </FormField>
                    case "time":
                        return <FormField key={name}>
                            <Label>{`${label} ${required ? "*" : ""}`}</Label>
                            <TimePicker
                                title={""}
                                time={value}
                                onChange={val => handleChange(format(val, "HH:mm:ss"), name)}
                            />
                            <FormError formErrors={formErrors} field={name} />
                        </FormField>
                    case "map":
                        return <FormField key={name}>
                            <Label>{`${label} ${required ? "*" : ""}`}</Label>
                            <LocationPicker
                                name={name}
                                label={buttonLabel}
                                location={value}
                                editable={true}
                                regions={regions}
                                regionsName={regionsName}
                                locationTitle={locationTitle}
                                mapType={mapType}
                                zoom={zoom}
                                setZoom={setZoom}
                                onChange={(val: any) => handleChange(val, name)}
                            />
                            <FormError formErrors={formErrors} field={name} />
                        </FormField>
                    case "attachment":
                        return <FormField key={name}>
                            <Label>{`${label} ${required ? "*" : ""}`}</Label>
                            <FileUploader
                                pathToUpload='test/uploads'
                                uxpContext={uxpContext}
                                afterUpload={(ref) => handleChange(JSON.stringify(ref), name)}>
                                <button className='uxp-button' type="button">
                                    {attachmentButtonLabel || "Upload"}
                                </button>
                            </FileUploader>
                        </FormField>

                        case "readonly":
                            return <FormField key={name}>
                                <Label>{`${label} ${required ? "*" : ""}`}</Label>
                                <Readonly
                                    displayValue={displayValue}
                                    value={value}
                                />
                            </FormField>

                        case "calculated":
                            return <FormField key={name}>
                                <Label>{`${label} ${required ? "*" : ""}`}</Label>
                                <Input
                                    value={calculateValue(formData) || ''}
                                onChange={val => {}}
                                placeholder={placeholder}
                                hasIndicator
                            />
                            </FormField>

                }

            }

            return <FormField key={name}>
                <Label>{`${label} ${required ? "*" : ""}`}</Label>
                <Input
                    value={value}
                    onChange={val => handleChange(val, name)}
                    placeholder={placeholder}
                    isValid={isValid(name, value)}
                    hasIndicator
                />
                <FormError formErrors={formErrors} field={name} />
            </FormField>
        })

        return formFields;
    }

    return (<>
        <div className="dymanic-form-container form-container">
            <form onSubmit={handleSubmit}>

                {
                    isDataLoaded ? generateForm() : null
                }

                <FormField className="buttons" >
                    <Conditional visible={!saving && !processing}>
                        <button className="uxp-button btn-cancel" type="reset" onClick={handleCancel}>Cancel</button>
                        <button className="uxp-button btn-submit" type="button" onClick={() => { setSaving(true) }}>Submit</button>
                    </Conditional>

                    <Conditional visible={saving && !processing}>
                        <button className="uxp-button btn-cancel" type="button" onClick={() => { setSaving(false) }}>Cancel</button>
                        <button className="uxp-button btn-confirm" type="submit">Confirm</button>
                    </Conditional>

                    <Conditional visible={processing} >
                        <button className="uxp-button btn-saving" type="button">Saving...</button>
                    </Conditional>

                </FormField>

            </form>
        </div>
    </>)
}

export default DynamicFormComponent