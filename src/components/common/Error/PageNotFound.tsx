import classNames from 'classnames'
import * as React from 'react'

interface IPageNotFoundProps { }

const PageNotFound: React.FC<IPageNotFoundProps> = (props) => {

    return <div className={classNames("mda-spa-error-page-container")} >
        <div className="overlay">
            <div className="icon-container">
                <div className="icon"></div>
            </div>

            <div className="message">
                <div className="title">Aw, snap!</div>
                <div className="sub-title">Page not found</div>
            </div>
        </div>
    </div>
}

export default PageNotFound