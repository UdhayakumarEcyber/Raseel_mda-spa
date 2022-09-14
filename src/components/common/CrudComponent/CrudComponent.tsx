import * as React from 'react'
import { Link, Route, Switch, useParams, useRouteMatch } from 'react-router-dom'
import { Button, DataTable } from 'uxp/components';
import { ICrudComponentProps } from '../../../../crud-component';

import BreadCrumb from '../BreadCrumb';
import { Conditional } from '../ConditionalComponent';
import PageNotFound from '../Error/PageNotFound';
import ExtendedRoute from '../ExtendedRoute';
import AddView from './AddView';
import EditView from './EditView';
import ListView from './ListView';

const CrudComponent: React.FunctionComponent<ICrudComponentProps> = (props) => {

    let { uxpContext, entityName, list, add, edit, roles } = props

    let {labels} = list?.default

    let { path } = useRouteMatch()

    function getRoles(view: string) {
        let _roles = (roles as any)?.[view] || []
        return _roles || []
    }

    return <div className='mda-spa-crud-component'>
        <Switch>
            <ExtendedRoute uxpContext={uxpContext} roles={getRoles("list")} exact path={path}>
                <BreadCrumb />
                <ListView {...list} uxpContext={uxpContext} entityName={entityName} roles={roles} />
            </ExtendedRoute>

            <ExtendedRoute uxpContext={uxpContext} roles={getRoles("add")} exact path={`${path}/${labels?.add || "add"}`}>
                <BreadCrumb />
                <AddView {...add} uxpContext={uxpContext} entityName={entityName} />
            </ExtendedRoute>

            <ExtendedRoute uxpContext={uxpContext} roles={getRoles("edit")} exact path={`${path}/${labels?.edit || "edit"}/:id`}>
                <BreadCrumb />
                <EditView {...edit} uxpContext={uxpContext} entityName={entityName} />
            </ExtendedRoute>

            <Route >
                <PageNotFound />
            </Route>
        </Switch>



    </div>
}


const MemorizedCRUDComponent: React.FunctionComponent<ICrudComponentProps> = (props) => {
    return <CrudComponent {...props} />
}

export default React.memo(MemorizedCRUDComponent)