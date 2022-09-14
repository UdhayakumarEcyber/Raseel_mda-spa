import * as React from 'react'
import { useParams } from 'react-router-dom'
import { FormFeedback, Loading, NotificationBlock, useToast } from 'uxp/components'
import { IAddViewProps, IDefaultUXPProps, IEditViewProps, IFormFieldDefinition } from '../../../../crud-component'
import { handleErrorResponse, handleSuccessResponse } from '../../../utils'
import { Conditional } from '../ConditionalComponent'
import FormError from '../FormError'
import DynamicFormComponent from './components/DynamicFormComponent'

interface IEditItemFormProps extends IEditViewProps, IDefaultUXPProps {
    entityName: string
}

const EditView: React.FunctionComponent<IEditItemFormProps> = (props) => {

    let { uxpContext, renderCustom: CustomAddView } = props

    return <div className='mda-spa-crud-add-view-container'>
        {
            CustomAddView
                ? <CustomAddView uxpContext={uxpContext} />
                : <EditForm {...props} />
        }
    </div>
}

const EditForm: React.FunctionComponent<IEditItemFormProps> = (props) => {
    let { uxpContext, entityName, default: { getDetails: { model: detailsModel, action: detailsAction, responseCodes: detailsResponseCodes }, model, action, responseCodes, formStructure, afterSave, onCancel, onChange }, renderCustom } = props
    let toast = useToast()

    let { id: _id } = useParams<{ id: string }>()

    let [structure, setStructure] = React.useState<IFormFieldDefinition[]>([])
    let [error, setError] = React.useState(null)
    let [loading, setLoading] = React.useState(true)


    React.useEffect(() => {
        getItemDetails()
    }, [_id, formStructure])

    React.useEffect(() => {

    }, [structure])

    function getItemDetails() {
        if (_id && _id.trim().length > 0) {
            setLoading(true)
            uxpContext.executeAction(detailsModel, detailsAction, { id: _id }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, detailsResponseCodes.successCode)
                    if (valid) {
                        if (data) {
                            let updated = formStructure.map(f => {
                                let _val = data[f.name]
                                f.value = _val

                                return f
                            })
                            setStructure(updated)
                            setLoading(false)
                            return
                        }
                    }
                    setLoading(false)
                    toast.error("Invalid Response")
                    setError("Invalid Response")

                })
                .catch(e => {
                    console.log(`Unable to get ${entityName} details. Exception: `, e);
                    let { valid, msg } = handleErrorResponse(e, detailsResponseCodes.errorCodes)
                    toast.error(msg)
                    setError(msg)
                    setLoading(false)
                })
        }
    }

    async function handleSubmit(data: any) {
        return new Promise<any>((done, nope) => {
            uxpContext.executeAction(model, action, { ...data, id: _id }, { json: true })
                .then(res => {
                    console.log("Response ", res);
                    let { valid, data } = handleSuccessResponse(res, responseCodes.successCode)

                    if (valid) {
                        afterSave()
                        done("saved")
                        toast.success(responseCodes.successMessage ? responseCodes.successMessage : `${entityName} updated`)
                        return
                    }

                    nope("")
                    toast.error("Invalid Response")
                })
                .catch(e => {
                    console.log("Exception:", e);
                    nope(e)
                    let { valid, msg } = handleErrorResponse(e, responseCodes.errorCodes)
                    toast.error(msg)
                })
        })
    }

    function handleCancel() {
        onCancel()
    }

    return <>
        <Conditional visible={loading} > <Loading /> </Conditional>
        <Conditional visible={error != null} > <NotificationBlock message={error} /> </Conditional>
        <Conditional visible={!loading && error == null} >
            <DynamicFormComponent
                formStructure={structure}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onChange={onChange}
            />
        </Conditional>

    </>
}

export default EditView 