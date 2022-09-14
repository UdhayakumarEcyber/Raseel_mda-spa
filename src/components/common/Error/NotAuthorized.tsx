import classNames from 'classnames'
import * as React from 'react'

interface INotAuthorizedProps { }

const NotAuthorized: React.FC<INotAuthorizedProps> = (props) => {

    return <div className={classNames("mda-spa-error-page-container")} >
        <div className="overlay">
            <div className="icon-container">
                <div className="icon"></div>
            </div>

            <div className="message">
                <div className="title">Aw, snap!</div>
                <div className="sub-title">You are not authorized to view this page</div>
            </div>
        </div>
    </div>
}

export default NotAuthorized