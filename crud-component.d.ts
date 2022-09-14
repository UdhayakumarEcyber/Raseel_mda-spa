import { ReactElement } from "react";
import { IContextProvider } from "./src/uxp";

interface IDefaultUXPProps {
    uxpContext: IContextProvider
}

interface IListColumn {
    name: string // name to display in column head 
    valueField?: string // name of the field 
    columnWidth: string // pass valid value to cahnge the column width (Ex: '20%' or '100px')
    renderColumn?: (item: any) => JSX.Element // this will override the default column rendering function
    disable?: boolean // default it will be false
}

interface IErrorProps {
    error: string,
    message: string
}
interface IErrorCodes {
    [code: number]: IErrorProps[]
    // this will be used to cvalidate the resposse 
    // Ex: {103202: [ {error: "ERR_REGISTRATION_NUMBER_ALREADY_EXISTS", message: "Registration number already exists"}  ]}
}

interface IResponseCodes {
    successCode: number,
    successMessage?: string,
    errorCodes: IErrorCodes
}

interface IListViewProps {
    default?: {
        model: string, // to get the data
        action: string,
        itemId: string,
        filterData?: (data: any[]) => any[],
        mapActionData?: (item: any) => any,
        labels?: {
            add?: string,
            edit?: string,
            delete?: string
        },
        responseCodes: IResponseCodes // this is for the given model action
        columns: IListColumn[],
        pageSize?: number, // number of items to load at once. default is 20 
        actions?: { // enable actions. defaults are true. pass false to disable
            edit?: boolean,
            delete?: boolean
            view?: boolean // not needed at the moment i think
        }
        deleteItem?: { // set the if delete is enabled
            model: string,
            action: string,
            responseCodes: IResponseCodes
        },
        showActionButtons?: boolean,
        toolbar?: {
            show?: boolean // toggle the toolbar  // default is true
            // these will be in left side 
            buttons?: {
                add?: {
                    show?: boolean // default is true,
                    label?: string // default is "Add"
                },
                export?: { // export to excel 
                    show: boolean // default is false 
                    label?: string // default is "Export to excel",

                    // this is a mapping of the fields to export with the column names 
                    // key will be the actual name of the field and value will be the column name that shows in excel sheet
                    columns: { [key: string]: string }
                },
                print?: {
                    show: boolean // default is false 
                    label?: string // default is "Print"
                }
            },
            customButton?: ReactElement,

            search: {
                show?: boolean // default true // APIs doesn't support search ye, so we will filter from frontend,
                searchableFields: string[] // list of fields that can be searched  
            }
        }
        // Show control bar which includes a search and 
        hideControlBar?: boolean,
        disableSearch?: boolean,
        disableReportButton?: boolean,
        /* Format of customColumnNamesInExcel is like this { [actual_key_name_in_data]: Column_name_in_excel}
        */
        customColumnNamesInExcel?: { [key: string]: string }
    },
    renderCustom?: React.FunctionComponent<IDefaultUXPProps> // this will overide the default list we have. you are required to get the data and render the table. also you need to handle edit/delete links accordingly
}

type IFormFieldType = 'string' | 'checkbox' | 'toggle' | 'number' | 'select' | 'date' | 'time' | 'map' | 'attachment' | 'readonly' | 'calculated'
interface IFormFieldDefinition {
    name: string, // name of the field
    label: string, // label to display
    type: string | IFormFieldType, // type of the input/editor
    value?: string | number | boolean, // default value if any
    displayValue?: string | number | boolean, // dislay value if any
    disable?: boolean,
    placeholder?: string, // placeholder
    options?: Array<any> | Array<{ label: string, value: string }>, // options for select input only,
    labelField?: string, // for select only
    valueField?: string, // for select only

    location?: {   
        mapType?: "Point" | "Polygon", // for map only
        locationTitle?: string,
        regions?: GeoJSON.Polygon | GeoJSON.Point, // for map only
        regionsName?: string, // for map only
        zoom: number,
        setZoom: (zoom: number)=> void    
    }
    buttonLabel?: string, // for map and attachment
    buttonIcon?: string // for map and attachment
    
    attachment?: {
        uxpContext: IContextProvider,
        buttonLabel: string
    },

    calculateValue?: (formFields: { [key: string]: any }) => any // for calculated values

    validate?: {
        required?: boolean // default is false 
        allowEmptyString?: boolean // trim value. only for string values 
        minLength?: number
        maxLength?: number
        regExp?: RegExp
        allowZeros?: boolean // on;y applicable to numbers 
        minVal?: number
        maxVal?: number
        customValidateFunction?: (value: any) => { valid: boolean, error?: string }// this is to give a custom validate function, which takes the value and return a boolean indicating value is valid or not
    }
}
interface IAddViewProps {
    default?: {
        model: string, // to save the new record
        action: string,
        responseCodes: IResponseCodes // this is for the given model action
        formStructure: IFormFieldDefinition[]
        afterSave: () => void,
        onCancel: () => void,
        onChange?: (prevFormData: { [key: string]: any }, formData: { [key: string]: any }) => ({ [key: string]: any });
    }
    renderCustom?: React.FunctionComponent<IDefaultUXPProps> // this will overide the default form we have. you are required to render the form and handle form submition and error handeling.
}

interface IEditViewProps {
    default?: {
        getDetails: {
            model: string, // to get the items detaisl 
            action: string,
            responseCodes: IResponseCodes // this is for the given model action
        },
        model: string, // to save updated record
        action: string,
        responseCodes: IResponseCodes // this is for the given model action
        formStructure: IFormFieldDefinition[]
        afterSave: () => void,
        onCancel: () => void,
        onChange?: (prevFormData: { [key: string]: any }, formData: { [key: string]: any }) => ({ [key: string]: any });
    }
    renderCustom?: React.FunctionComponent<IDefaultUXPProps> // this will overide the default form we have. you are required to render the form and handle form submition and error handeling.
}

interface ICrudComponentProps extends IDefaultUXPProps {
    entityName: string // entity name Ex. Parking Operator, Manufacturer
    roles?: {
        list?: string[],
        add?: string[],
        edit?: string[],
        delete?: string[],
    },
    list: IListViewProps,
    add?: IAddViewProps
    edit?: IEditViewProps
}

interface IDynamicFormComponentProps {
    formStructure: IFormFieldDefinition[],
    onSubmit: (data: { [key: string]: string | number | boolean }) => Promise<any>
    onCancel?: () => void
    onChange?: (prevFormData: { [key: string]: any }, formData: { [key: string]: any }) => ({ [key: string]: any });
}