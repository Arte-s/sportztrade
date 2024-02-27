import React from "react";
export class Modal extends React.Component<{
    status?:boolean,
},{
    status:boolean
}>{
    constructor(props:any) {
        super(props);
        this.state= {status: this.props.status ?? false}
    }
    render() {
        return <>{this.state.status && <div className={"popup"}>
            <div className={"popup__content"}>
                <a className="popup__close" href="#" onClick={() => {
                    let status = false;
                    this.setState({status});
                }}>✕</a>
                <p className={"popup__title"}>
                    Are you sure you want to logout?

                </p>

                <div className="popup__actions">
                    <a className="login-btn login-btn_brown"
                       onClick={() => {
                           let status = false;
                           this.setState({status});
                       }}
                    >Cancel</a>
                    <a href="#" className="login-btn">Logout</a>
                </div>
            </div>

        </div>}</>;
    }
}



