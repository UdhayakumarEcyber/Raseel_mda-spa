import * as React from "react";
import { registerUI, IContextProvider, registerMenuItem, registerLink, } from './uxp';
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage";
import ParkingOperator from "./components/ParkingOperator/ParkingOperator";


import './assets/styles/styles.scss';
import App from "./components/App/App";


interface IWidgetProps {
    uxpContext?: IContextProvider,
    instanceId?: string
}


const SmartParkingUI: React.FunctionComponent<IWidgetProps> = (props) => {
    return <App uxpContext={props.uxpContext} />
}


/**
 * Register as a UI
 */


registerUI({
    id: "smart-parking",
    component: SmartParkingUI,
    showDefaultHeader: false
});
