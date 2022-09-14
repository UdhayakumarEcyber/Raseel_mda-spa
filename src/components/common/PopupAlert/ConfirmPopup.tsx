import * as React from 'react'
import { Button } from 'uxp/components'
import PopupAlert from './PopuAlert'

interface IConfirmPopupProps {
    show: boolean,
    onConfirm: {
        execute: () => Promise<any>
        onComplete?: () => void
        onError?: (e: any) => void
    },
    afterConfirm?: () => void
    onCancel: () => void
    title?: string
    message: string,
    processingMessage: string
}

const ConfirmPopup: React.FunctionComponent<IConfirmPopupProps> = (props) => {
    let { show, onConfirm: { execute, onComplete, onError }, onCancel, afterConfirm, message, title, processingMessage } = props

    let [processing, setProcessing] = React.useState(false)

    React.useEffect(() => {
        if (show) {
            setProcessing(false)
        }
    }, [show])

    function handleConfirm() {
        setProcessing(true)
        execute()
            .then(res => {
                onComplete && onComplete()
            })
            .catch(e => {
                onError && onError(e)
            })
    }


    return <PopupAlert
        show={show}
        title={title ? title : 'Please confirm'}
        onClose={onCancel}
        content={<div className='mda-spa-web-confirm-popup'>
            {
                processing ?
                    <div className="message"> {processingMessage} </div>
                    : <>
                        <div className="message"> {message} </div>

                        <div className="actions">
                            <Button title='No' onClick={onCancel} />
                            <Button title='Yes' onClick={handleConfirm} />
                        </div>
                    </>
            }

        </div>}
        showCloseButton={false}
    />
}

export default ConfirmPopup