import * as React from 'react'
import { useToast } from 'uxp/components'
import { IAddViewProps, IDefaultUXPProps } from '../../../../crud-component'
import { handleErrorResponse, handleSuccessResponse } from '../../../utils'
import DynamicFormComponent from './components/DynamicFormComponent'

interface IAddItemFormProps extends IAddViewProps, IDefaultUXPProps {
    entityName: string
}

const AddView: React.FunctionComponent<IAddItemFormProps> = (props) => {

    let { uxpContext, renderCustom: CustomAddView } = props

    return <div className='mda-spa-crud-add-view-container'>
        {
            CustomAddView
                ? <CustomAddView uxpContext={uxpContext} />
                : <AddForm {...props} />
        }
    </div>
}

const AddForm: React.FunctionComponent<IAddItemFormProps> = (props) => {
    let { uxpContext, entityName, default: { model, action, responseCodes, formStructure, afterSave, onCancel, onChange }, renderCustom } = props
    let toast = useToast()

    async function handleSubmit(data: any) {
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction(model, action, data, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)
                    if (valid) {
                        afterSave()
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `${entityName} created`)
                        return
                    }
                    nope("")
                    toast.error("Invalid Response")
                })
                .catch(e => {
                    console.log(`Unable to create ${entityName}. Exception:`, e);
                    let { valid, msg } = handleErrorResponse(e, responseCodes.errorCodes)
                    nope(e)
                    toast.error(msg)
                })
        })
    }

    function handleCancel() {
        onCancel()
    }

    return <DynamicFormComponent
        formStructure={formStructure}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onChange={onChange}
    />
}

export default AddView 