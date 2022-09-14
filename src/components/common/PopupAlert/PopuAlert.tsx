import * as React from 'react'
import { Modal } from 'uxp/components'

interface IPopupAlertProps {
    show: boolean
    onClose: () => void
    showCloseButton?: boolean,
    title: string,
    content: JSX.Element,
    className?: string,
    dismissOnClickOutside?: boolean
}

const PopupAlert: React.FunctionComponent<IPopupAlertProps> = (props) => {
    let { show: _show, onClose, showCloseButton, title, content, className, dismissOnClickOutside } = props

    let [show, setShow] = React.useState(_show)

    React.useEffect(() => { setShow(_show) }, [_show])

    function onCloseModal() {
        setShow(false)
        onClose()
    }

    return <Modal
        show={show}
        onClose={onCloseModal}
        showCloseButton={showCloseButton}
        title={title}
        className={`mda-spa-web-popup-alert ${className} `}
        backgroundDismiss={dismissOnClickOutside || false}
    >
        {content}
    </Modal>
}

export default PopupAlert