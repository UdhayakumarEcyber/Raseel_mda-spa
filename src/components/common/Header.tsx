import * as React from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { Button, ItemCard } from 'uxp/components';
import { IContextProvider } from '../../uxp';
import UserProfileComponent from './UserProfile';


interface IHeaderProps {
    title: string,
    uxpContext: IContextProvider
}

const Header: React.VoidFunctionComponent<IHeaderProps> = (props) => {
    const history = useHistory();
    return (
        <div className="header">

            <div className="left">
            </div>

            <div className="middle">
                <div className="title">{props.title}</div>
            </div>

            <div className="right">
                <UserProfileComponent uxpContext={props.uxpContext} />
            </div>

        </div>
    )
}

export default Header;
