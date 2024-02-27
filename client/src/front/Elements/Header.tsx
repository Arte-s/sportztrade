import React from "react";
import {Modal} from "./Modal";
export class Header extends React.Component<{
    status?:boolean,
},{
    status:boolean
}> {
    constructor(props:any) {
        super(props);
        this.state= {status: false}
    }
    render() {
        return <header className={'header'}>
            <div className="menu">
                <a href="#" className="header__menu"></a>
                <ul className="menu-list _hide">
                    <li className="menu-list__item">
                        <a href="#" className="menu-list__link menu-list__link_profile">
                            Profile
                        </a>
                    </li>
                    <li className="menu-list__item">
                        <a href="../pages/settings.html" className="menu-list__link menu-list__link_settings">
                            Settings
                        </a>
                    </li>
                    <li className="menu-list__item">
                        <a href="#" className="menu-list__link menu-list__link_light">
                            Light mode
                        </a>
                    </li>
                    <li className="menu-list__item">
                        <a href="#" className="menu-list__link menu-list__link_tutorials">
                            Tutorials
                        </a>
                    </li>
                    <li className="menu-list__item">
                        <a href="#" className="menu-list__link menu-list__link_website">
                            Website
                        </a>
                    </li>
                    <li className="menu-list__item">
                        <a href="#" className="menu-list__link menu-list__link_support">
                            Support
                        </a>
                    </li>
                    <li className="menu-list__item">
                        <a className="menu-list__link menu-list__link_logout"
                           onClick={() => {
                               this.setState({status: true});
                           }}>
                            Logout
                        </a>
                    </li>
                </ul>
            </div>

            <h1 className="header__logo">
                <a className="header__logo-image" href="#"></a>
            </h1>

            {this.state.status && <Modal status={this.state.status}/>}

        </header>;
    }
}


