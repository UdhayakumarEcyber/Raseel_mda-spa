import * as React from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom';
import { hasAnyRole } from '../../utils';
import { IContextProvider } from '../../uxp';
import { IMenuItem } from '../App/App';

interface ISidebarProps {
    menuItems: IMenuItem[],
    uxpContext: IContextProvider
}

const Sidebar: React.VoidFunctionComponent<ISidebarProps> = (props) => {
    return (
        <div className="sidebar">
            <div className="sidebar-title">
                <NavLink to="/" className={'logo-container'} >
                    <div className="logo"></div>
                </NavLink>
            </div>

            <div className="sidebar-menu">
                <div className="sidebar-menu-item-group">
                    {
                        props.menuItems.map((item) => <SidebarItem uxpContext={props.uxpContext} item={item} />)
                    }
                </div>
            </div>
        </div>
    )
}

interface ISideBarMenuProps {
    item: IMenuItem
}

const SideBarMenu: React.FunctionComponent<ISideBarMenuProps> = (props) => {
    const { item } = props;
    return <>
        <div className="sidebar-menu-item-icon-cont" >
            <div className="icon" style={{ backgroundImage: `url(${item.iconPath})` }}></div>
        </div>
        <span className="sidebar-menu-item-text ml-2 text-sm font-medium">{item.name}</span>
    </>
}

const SidebarItem: React.FunctionComponent<{ uxpContext: IContextProvider, item: IMenuItem }> = (props) => {
    let { uxpContext, item } = props
    let [hasRole, setHasRole] = React.useState(false)

    React.useEffect(() => {
        validate()
    }, [])

    async function validate() {
        let roles = item.roles || []
        let hasRole = false
        if (roles.length == 0) {
            setHasRole(true)
            return
        }
        try {

            let viewRoles = roles.filter(r => r.startsWith("canview"))
            console.log("view roles ", viewRoles);

            if (viewRoles.length > 0) {

                let otherRoles = roles.filter(r => !r.startsWith('canview'))
                let hasOtherRoles = await hasAnyRole(uxpContext, otherRoles)
                let hasViewRoles = await hasAnyRole(uxpContext, viewRoles)

                hasRole = hasOtherRoles && hasViewRoles
            }
            else {
                hasRole = await hasAnyRole(uxpContext, roles)
            }
        }
        catch (e) { }
        setHasRole(hasRole)
    }

    if (!hasRole) return null

    if (item.redirect) return (<a className="sidebar-menu-item" href={item.link}>
                <SideBarMenu item={item} />
            </a>)


    return (<NavLink exact={false} activeClassName="active" to={item.link} className="sidebar-menu-item" href="#">
        <SideBarMenu item={item} />
    </NavLink>)
}

export default Sidebar;
