import {CellClassParams} from "ag-grid-community";

export const StyleGridDefault = {
    'fontFamily': 'Inter',
    'fontStyle': 'normal',
    'fontWeight': '400',
    'fontSize': '12px',
    'paddingLeft': '10px',
    'paddingRight': '10px',
    'lineHeight': '28px',
    'paddingTop': '0px',
    'paddingBottom': '0px',
    'textAlign': 'left',
    'width': '50%',
    'textTransform': 'uppercase'
}

export function StyleCSSHeadGridEdit(name: string, rules: string) {
    // let style = document.createElement('style');
    // style.type = 'text/css';
    // document.getElementsByTagName('head')[0].appendChild(style);
    // style.sheet?.insertRule(name + "{" + rules + "}", 0);
}

export function StyleCSSHeadGrid() {
    // уменьшаем отступы с боков для заголовков
    StyleCSSHeadGridEdit('.ag-theme-alpine-dark .ag-header-cell, .ag-theme-alpine-dark .ag-header-group-cell',
        "padding-left: 0; padding-right: 0;"
    );
    // выравнивание в заголовке по центру
    StyleCSSHeadGridEdit('.ag-header-cell-label', 'justify-content: center');
}

export type tCallFuncAgGrid<T> = (params: CellClassParams & { data: T }) => {}
