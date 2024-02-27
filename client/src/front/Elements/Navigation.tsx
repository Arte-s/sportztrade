import React from "react";
export class Navigation extends React.Component {
    render() {
        return <div className="navigation">
            <div className="navigation__item navigation-display">
                <p className="navigation-display__lbl">
                    Rows per page:
                </p>
                <div className="navigation-display__select custom-select">
                    <select className="select" name="pages" id="pages">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                    </select>
                </div>
            </div>
            <ul className="navigation__item navigation-pages">
                <li className="navigation-pages__item navigation-pages__item_arrow"></li>
                <li className="navigation-pages__item">1</li>
                <li className="navigation-pages__item">2</li>
                <li className="navigation-pages__item">3</li>
                <li className="navigation-pages__item">...</li>
                <li className="navigation-pages__item">7</li>
                <li className="navigation-pages__item navigation-pages__item_arrow"></li>
            </ul>
        </div>;
    }
}


