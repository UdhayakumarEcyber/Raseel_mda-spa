const classNames = require('classnames')
import * as React from 'react'

interface IReadonlyProps {
    value: string,
    displayValue?: string,
    className?: string
}

const Readonly: React.FunctionComponent<IReadonlyProps> = (props) => {
    let { value, className, displayValue } = props

    return (<div className={classNames("uxp-input-container readonly", className, { "has-content": value?.length > 0 })}
    >
        <div className={classNames("uxp-form-input", { "active": value })} >
            {!!displayValue ? displayValue : value}
        </div>
    </div>)
}

export default Readonly