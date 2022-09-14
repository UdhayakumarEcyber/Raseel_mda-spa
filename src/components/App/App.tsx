import * as React from 'react'
import { Input } from 'uxp/components';
import { HashRouter as Router, Redirect, Route, Switch, useLocation } from "react-router-dom";
import LandingPage from '../LandingPage/LandingPage';
import ParkingOperator from '../ParkingOperator/ParkingOperator';
import { IContextProvider } from '../../uxp';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import Manufacturers from '../Manufacturers/Manufacturers';
import VehicleModels from '../VehiclesModel/VehiclesModel';
import Devices from '../Devices/Devices';
import ParkingAccess from '../ParkingAccess/ParkingAccess';
import ParkingInformation from '../ParkingInformation/ParkingInformation';
import ParkingRecords from '../ParkingRecords/ParkingRecords';
import Penalties from '../Penalties/Penalties';
import ViolationTypes from '../ViolationTypes/ViolationTypes';
import Drivers from '../Drivers/Drivers';
import SupportTickets from '../SupportTickets/SupportTickets';
import BookParkingSpot from '../BookParkingSpot/BookParkingSpot';

import parkingIcon from '../../assets/images/parking.svg';
import deviceIcon from '../../assets/images/devices.svg';
import manufacturerIcon from '../../assets/images/manufacturer.svg';
import vehicleModelIcon from '../../assets/images/vehicle-model.svg';
import driverIcon from '../../assets/images/driver.svg';
import parkingRecordsIcon from '../../assets/images/two-cars-in-line.svg';
import bookSpotIcon from '../../assets/images/book-spot.svg';
import courIcont from '../../assets/images/court.svg';
import ticketIcon from '../../assets/images/ticket.svg';
import moneyIcon from '../../assets/images/money.svg';
import telephoneIcon from '../../assets/images/telephone.svg';
import parkingAccessIcon from '../../assets/images/parking-access.svg';
import dashboardIcon from '../../assets/images/home.svg';
import blacklistIcon from '../../assets/images/blacklist.svg';

import ExtendedRoute from '../common/ExtendedRoute';
import PageNotFound from '../common/Error/PageNotFound';
import SpecialPermits from '../SpecialPermits/SpecialPermits';
import { loadAllRoles } from '../../role-manager';
import Blacklist from '../Blacklist/Blacklist';

export interface IMenuItem {
    name: string,
    link: string,
    iconPath?: string,
    roles?: string[],
    component: React.FC<any> | null,
    redirect?: boolean
}

export const MenuItems: IMenuItem[] = [
    { name: 'Dashboard', iconPath: `"${dashboardIcon}"`, link: '/landing-page', component: LandingPage },
    {
        name: 'Manage Parking Operator', iconPath: `"${parkingIcon}"`, link: '/parking-operator',
        roles: ["cancreateparkingoperator", "canupdatepaarkingoperator", "candeleteparkingoperator", "canviewparkingoperator"],
        component: ParkingOperator
    },
    {
        name: 'Manage Parking Information', iconPath: `"${parkingIcon}"`, link: '/parking-information',
        roles: ["cancreateparkingspot", "canupdateparkingspot",
            "candeleteparkingspot", "canviewparkingspot", "cancreateparkingsite", "canupdateparkingsite",
            "candeleteparkingsite", "canviewparkingsite", "cancreateparkinggroup", "canupdateparkinggroup",
            "candeleteparkinggroup", "canviewparkinggroup"],
        component: ParkingInformation
    },
    {
        name: 'Manage Devices', iconPath: `"${deviceIcon}"`, link: '/devices',
        roles: ["cancreatedevice", "canupdatedevice", "candeletedevice", "canviewdevice"],
        component: Devices
    },
    {
        name: 'Manage Manufacturers', iconPath: `"${manufacturerIcon}"`, link: '/manufacturers',
        roles: ["cancreatemanufacturer", "canupdatemanufactrer", "candeletemanufacturer", "canviewmanufacturer"],
        component: Manufacturers
    },
    {
        name: 'Manage Vehicle Models', iconPath: `"${vehicleModelIcon}"`, link: '/vehicle-model',
        roles: ["cancreatevehiclemodel", "canupdatevehiclemodel", "candeletevehiclemodel", "canviewvehiclemodel"],
        component: VehicleModels
    },
    {
        name: 'Manage Driver Profiles', iconPath: `"${driverIcon}"`, link: '/manage-driver-profiles',
        roles: ["cancreatedriver", "canupdatedriver", "candeletedriver", "canviewdriver"],
        component: Drivers
    },
    {
        name: 'Manage Parking Access', iconPath: `"${parkingAccessIcon}"`, link: '/parking-access',
        roles: ["cancreateparkingaccess", "canupdateparkingaccess", "candeleteparkingaccess", "canviewparkingaccess"],
        component: ParkingAccess
    },
    {
        name: 'Booking Records', iconPath: `"${parkingRecordsIcon}"`, link: '/parking-records',
        roles: ["canviewparkinghistory"],
        component: ParkingRecords
    },
    {
        name: 'Book Parking Spot', iconPath: `"${bookSpotIcon}"`, link: '/book-parking-spot',
        roles: ["canbookparkingspot"],
        component: BookParkingSpot
    },
    {
        name: 'Manage Penalties', iconPath: `"${courIcont}"`, link: '/manage-penalties',
        roles: ["cancreatepenalty", "canupdatepenalty", "canviewpenalty", "candeletepenalty"],
        component: Penalties
    },
    {
        name: 'Manage Violation Types', iconPath: `"${courIcont}"`, link: '/violation-types',
        roles: ["cancreateviolationtype", "canupdateviolationtype", "canviewviolationtype", "candeleteviolationtype"],
        component: ViolationTypes
    },
    {
         name: 'Manage Support Tickets', iconPath: `"${courIcont}"`, link: '/support-tickets',
         roles: ["cancreateticket", "canresolveticket", "canrejectticket", "canacceptticket", "canviewticket"],
         component: SupportTickets
    },
    {
        name: "Manage Special Permits", iconPath: `"${manufacturerIcon}"`, link: "/speacial-permits",
        roles: ["cancreatespecialpermits", "canupdatespecialpermits", "candeletespecialpermits", "canviewspecialpermits", "canassignspecialpermits"],
        component: SpecialPermits,
    },
    {
        name: "Manage Blacklists", iconPath: `"${blacklistIcon}"`, link: "/manage-blacklists",
        roles: ["canblacklistdriver", "canunblacklistdriver", "canviewblacklisteddriver"],
        component: Blacklist,
    }
    

    // {
    //     name: 'Manage Lost Ticket', iconPath: `"${ticketIcon}"`, link: '/manage-lost-ticket',
    //     roles: [],
    //     component: null
    // },
    // {
    //     name: 'Recharge wallets', iconPath: `"${moneyIcon}"`, link: '/recharge-wallets',
    //     roles: [],
    //     component: null
    // },
    // {
    //     name: 'Support', iconPath: `"${telephoneIcon}"`, link: '/support',
    //     roles: [],
    //     component: null
    // },

]

interface IAppProps {
    uxpContext: IContextProvider
}


const App: React.FunctionComponent<IAppProps> = (props) => {

    let { uxpContext } = props
    let [ loadingRoles, setLoadingRoles ] = React.useState<boolean>(true);

    React.useEffect(() => {
        loadAllRoles(props.uxpContext)
            .then((roles) => console.log('Loaded roles:', roles))
            .catch(err => console.error(`Error loading roles: ${err}`))
            .finally(() => setLoadingRoles(false));
    }, [props.uxpContext])

    if (loadingRoles) {
        return <div />;
    }

    return (
        <div className="mda-spa-web-ui-container">
            <Router>
                <Sidebar menuItems={MenuItems} uxpContext={props.uxpContext} />

                <div className="main">

                    <Header uxpContext={props.uxpContext} title="Raseel Smart Parking Platform" />

                    <Switch>

                        <Route exact path={"/"} >
                            <Redirect to={'/landing-page'} />
                        </Route>

                        {
                            MenuItems.map((m, k) => {
                                let Component = m.component

                                if(m.redirect) return null

                                return <ExtendedRoute uxpContext={uxpContext} roles={m.roles || []} path={m.link} >
                                    {Component && <Component uxpContext={uxpContext} />}
                                </ExtendedRoute>

                            })
                        }

                        < Route >
                            <PageNotFound />
                        </Route >
                    </Switch >
                </div >
            </Router >

        </div >
    )
}

export default App;
