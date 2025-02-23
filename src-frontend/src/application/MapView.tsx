

import * as React from 'react';
import Dictionary from '../components/Dictionary';
import IFrameDialog from '../components/IFrameDialog';

export default function MapView(props:{ app?:boolean }) {
    return (
        <React.Fragment>
            <IFrameDialog 
                url={"/map/regions" + (props.app ? "?app=true" : "")} 
                title={Dictionary("frontend.menu.map", "Map")} 
            />
        </React.Fragment>
    );
}