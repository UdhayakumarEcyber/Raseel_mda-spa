import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { hasAnyRole } from '../../utils'
import { IContextProvider } from '../../uxp'
import { IMenuItem, MenuItems } from '../App/App'

interface ILandingPage {
    uxpContext: IContextProvider
}

const LandingPage: React.VoidFunctionComponent<ILandingPage> = (props) => {

    return (<div className="page-content">
        <div className="landing-page">
            <div className="cards">
                {
                    MenuItems
                        .filter((item) => item.name !== 'Dashboard')
                        .map((menuItem, index) => <CardComponent uxpContext={props.uxpContext} item={menuItem} key={index} />)
                }
            </div>

        </div>
    </div>)
}

const CardComponent: React.FunctionComponent<{ uxpContext: IContextProvider, item: IMenuItem }> = (props) => {
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
    
    if (item.redirect) return (<a href={item.link}>
        <Card item={item} />
    </a>);

    return <NavLink to={item.link}>
        <Card item={item} />
    </NavLink>
}

interface ICardProps {
    item: IMenuItem
}

const Card: React.FunctionComponent<ICardProps> = props => {

    const { item } = props;

    return <div className="card">

        <div className="card-image-cont"  >
            <div className='icon' style={{ backgroundImage: `url(${item.iconPath})` }}></div>
        </div>

        <div className="container line-clamp line-clamp-3">
            <h4>{item.name}</h4>
        </div>
    </div>
}


export default LandingPage