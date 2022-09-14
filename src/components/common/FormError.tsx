import * as React from 'react'
import { Conditional } from './ConditionalComponent'

interface IFormError {
    formErrors: { [key: string]: string }
    field: string
}


const FormError: React.FunctionComponent<IFormError> = (props) => {
    let { formErrors, field } = props
    return (<Conditional visible={formErrors && formErrors[field] && formErrors[field].trim().length > 0}>
        <div className="uxp-form-error">{formErrors[field]}</div>
    </Conditional>)
}

export default FormError

