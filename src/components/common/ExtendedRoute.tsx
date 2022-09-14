import * as React from 'react'
import { Route, RouteProps } from 'react-router-dom';
import { Loading } from 'uxp/components';
import { hasAnyRole } from '../../utils';
import { IContextProvider } from '../../uxp';
import { MenuItems, IMenuItem } from '../App/App';
import NotAuthorized from './Error/NotAuthorized';

interface IExtendedRoute extends RouteProps {
    uxpContext: IContextProvider,
    roles: string[]
}

const ExtendedRoute: React.FC<IExtendedRoute> = (props) => {

    let { uxpContext, children, roles, ...rest } = props
    let [hasRole, setHasRole] = React.useState(false)
    let [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        validate()
        console.log("_roles", roles);

    }, [roles])

    async function validate() {
        if (!roles) return setHasRole(false)
        let hasRole = false
        if (roles.length == 0) {
            setHasRole(true)
            setLoading(false)
            return
        }
        try {
            setLoading(true)

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
        setLoading(false)
        setHasRole(hasRole)
    }

    return <Route {...rest}>

        {roles != null && !loading ?
            <> {
                hasRole ? children : <NotAuthorized />}
            </>
            : <Loading />
        }
    </Route>
}

export default ExtendedRoute