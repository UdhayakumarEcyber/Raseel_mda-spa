import * as React from 'react'
import { Button, PortalContainer, ProfileImage } from 'uxp/components'
import { IContextProvider, IUserDetails } from '../../uxp'
import { CSSTransition } from 'react-transition-group';

interface IUserProfileProps {
    uxpContext: IContextProvider
}

const UserProfileComponent: React.FunctionComponent<IUserProfileProps> = (props) => {

    let [details, setDetails] = React.useState<IUserDetails>(null)
    let [showProfile, setShowProfile] = React.useState<boolean>(false);
    let [coords, setCoords] = React.useState({});


    React.useEffect(() => {
        props.uxpContext.getUserDetails()
            .then(res => setDetails(res))
            .catch(e => console.log(e))
    }, [])

    // ref
    let backdropRef = React.useRef(null);
    let buttonRef = React.useRef(null);

    const handleClick = () => {
        let buttonDetails = buttonRef.current.getBoundingClientRect();

        let _coords: any = {
            top: buttonDetails.y + window.scrollY - 10,
            right: window.innerWidth - buttonDetails.right - 10,
        }

        setCoords(_coords);

        setShowProfile(true)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target == backdropRef.current) {
            setShowProfile(false)
        }
    }

    return <div className='lxp-user-profile-container mda-spa-user-profile'>
        <div className="profile-button" onClick={handleClick} ref={buttonRef}>
            <ProfileImage
                image={details?.profileImage ? '/AccountResources/profilepics/' + details?.profileImage : ''}
                name={details?.name}
                bgColor='#171b4a'
                textColor='#fff'
            />
            <div className="text has-dropdown">{details?.name || ""}</div>
        </div>

        <CSSTransition
            in={showProfile}
            timeout={201.25}
            unmountOnExit={true}
            classNames="f-fade"
        >
            <PortalContainer>
                <div className="profile-details-backdrop" onClick={handleBackdropClick} ref={backdropRef}>
                    <div className="profile-details-panel  mda-spa-user-profile" style={coords}>

                        <div className="header">
                            <div className="profile-image">

                                <ProfileImage
                                    image={details?.profileImage ? '/AccountResources/profilepics/' + details?.profileImage : ''}
                                    name={details?.name}
                                    bgColor='#171b4a'
                                    textColor='#fff'
                                />

                                <div className="text"> {details?.name || ''}</div>
                            </div>

                            <div className="drop-close-button" onClick={() => { setShowProfile(false) }}></div>
                        </div>

                        <div className="toolbar">
                            <div className='row'>
                                <div className="label">USER DASHBOARD</div>
                                <Button title="View" onClick={() => { window.location.href = props.uxpContext.lucyUrl + "Apps/User/userdashboard" }} />
                            </div>
                        </div>

                        <div className="toolbar no-border logout">
                            <Button title="LOG OUT" onClick={props.uxpContext.onLogout} />
                        </div>


                    </div>
                </div>
            </PortalContainer>
        </CSSTransition>
    </div>
}

export default UserProfileComponent