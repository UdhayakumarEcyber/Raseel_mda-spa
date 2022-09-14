import * as React from 'react'
import { Button, Input } from 'uxp/components'
import PopupAlert from './PopuAlert'

interface IInputPopupProps {
    show: boolean,
    onConfirm: {
        execute: (inputText: string) => Promise<any>
        onComplete?: () => void
        onError?: (e: any) => void
    },
    afterConfirm?: () => void
    onCancel: () => void
    title?: string
    message: string,
    successButtonText?: string,
    processingMessage: string
}

const InputPopup: React.FunctionComponent<IInputPopupProps> = (props) => {
    let { show, successButtonText, onConfirm: { execute, onComplete, onError }, onCancel, afterConfirm, message, title, processingMessage } = props

    let [processing, setProcessing] = React.useState(false)
    let [inputText, setInputText] = React.useState<string>('')

    React.useEffect(() => {
        if (show) {
            setProcessing(false)
        }
    }, [show])

    function handleConfirm() {
        setProcessing(true)
        execute(inputText)
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
                        <div className="message">
                            <Input
                                placeholder={message}
                                onChange={(value) => setInputText(value)}
                                value={inputText}
                            />
                        </div>

                        <div className="actions">
                            <Button title='Cancel' onClick={onCancel} />
                            <Button title={ successButtonText || 'Ok'} onClick={handleConfirm} />
                        </div>
                    </>
            }

        </div>}
        showCloseButton={false}
    />
}

export default InputPopup