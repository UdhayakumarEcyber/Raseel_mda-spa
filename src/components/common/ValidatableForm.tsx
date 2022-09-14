import React from "react";
import { useEffect } from "react";
import { FormField, Label } from "uxp/components";
import { Conditional } from "./ConditionalComponent";

export type FormError = { fieldName: string, description: string };
export type FormErrors = { [fieldName: string]: FormError };

export type FormValue = { fieldName: string, value: any, hasChangedByUser?: boolean };

export type FormValues = { [fieldName: string]: FormValue };

// The Context used to pass errors from ValideForm to ValidatableFormField
export interface IValidatableContext {
    disabled?: boolean;
    onValueChange?: (value: any, fieldName: string, hasValueChangedByUser: boolean) => any;
    errors: FormErrors,
    refreshCount?: number,
}

export const ValidateContext = React.createContext<IValidatableContext>({
    disabled: false,
    errors: {}
});


export type Validator = 'isRequired' | 'allowEmptyString';

export type FieldValidation = { fieldName: string, label: string, validatorCollection: Validator[] };

export interface IValidatableFormProps {
    validateSchema: { [fieldName: string]: FieldValidation };
    onValuesChange?: (value: any, fieldName: string) => any;
    onFieldsValidate?: (errors: FormErrors) => any
}

export type ValidatableFormRef = {
    validateFields: (forceValidate: boolean) => FormErrors,
    refresh: () => any,
    disable: () => any,
    enable: () => any,
};

export const ValidatableForm = React.forwardRef<ValidatableFormRef, React.PropsWithChildren<IValidatableFormProps>>((props, ref) => {

    const [errors, setErrors] = React.useState<FormErrors>({});
    const [enabled, setEnabled] = React.useState<boolean>(true);
    const [refreshCount, setRefreshCount] = React.useState<number>(0);
    const [formValues, setFormValues] = React.useState<FormValues>({});
    const [valueChangeCount, setValueChangeCount] = React.useState<number>(0);

    // force validate means validating field even though user has not changed the value.
    const validateFields = (isForceValidate: boolean): FormErrors => {
        let errs: FormErrors = {};

        Object.keys(props.validateSchema).forEach(fieldName => {
            let schemeForField = props.validateSchema[fieldName];
            if (!schemeForField) return;

            let formValue = formValues[fieldName];

            if (!formValue?.hasChangedByUser && !isForceValidate) {
                return;
            }

            if (schemeForField.validatorCollection.includes('isRequired') && !(!!formValue.value || formValue.value === 0)) {
                errs[fieldName] = {
                    fieldName,
                    description: `${schemeForField.label} is required.`
                };

                return;
            }
        });
        setErrors(errs);
        return errs;
    };

    // If values changed
    useEffect(() => {
        if (!enabled) return;

        let errs = validateFields(false);
        setErrors(errs);

        props.onFieldsValidate && props.onFieldsValidate(errs);
    }, [valueChangeCount]);


    // Pass validate field function to parent for force validate
    React.useImperativeHandle(ref, () => ({
        validateFields,
        refresh: () => {
            let formValuesClone = { ...formValues };
            Object.keys(formValuesClone).forEach(fieldName => {
                formValuesClone[fieldName] = { ...formValuesClone[fieldName], hasChangedByUser: false };
            });
            setFormValues(formValuesClone);
            setErrors({});
            setRefreshCount((v) => v + 1)
        },
        disable() {
            setEnabled(false)
        },
        enable() {
            setEnabled(true)
        }
    }), [valueChangeCount])

    const handleFormValueChange = (value: any, fieldName: string, hasChangedByUser: boolean) => {
        setFormValues((previousValues) => ({ ...previousValues, [fieldName]: { fieldName, value, hasChangedByUser } }));
        setValueChangeCount(valueChangeCount + 1);
    };

    return (
        <ValidateContext.Provider value={{
            disabled: !enabled,
            errors: errors,
            refreshCount,
            onValueChange: (value, fieldName, hasChangedByUser) => { handleFormValueChange(value, fieldName, hasChangedByUser) }
        }}>
            {props.children}
        </ValidateContext.Provider>
    )
});


export interface IValidatableFormFieldProps {
    fieldName: string,
    label: string,
    value: any;
    className?: string;
}

export const ValidatableFormField: React.FC<IValidatableFormFieldProps> = (props) => {
    // To skip first render(lazy validate)
    const valueChanged = React.useRef<boolean>(false);

    const {disabled, errors, onValueChange, refreshCount} = React.useContext<IValidatableContext>(ValidateContext);

    React.useEffect(() => {
            valueChanged.current = false;
            onValueChange(props.value, props.fieldName, false)
    }, [refreshCount])

    React.useEffect(() => {
        onValueChange(props.value, props.fieldName, !!valueChanged.current)
        console.log("Changed", valueChanged.current)
        if (!valueChanged.current) {
            valueChanged.current = true;
        }
    }, [props.value])
    
    const error = errors[props.fieldName];

    return (
        <FormField className={`form-field ${props.className ?? ''}`}>
            <Label>{props.label}</Label>

            {props.children}

            <Conditional visible={!!error && !disabled}>
                <div className="uxp-form-error">{
                    error?.description
                }</div>
            </Conditional>
        </FormField>
    )
}
