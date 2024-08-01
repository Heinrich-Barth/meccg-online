

import * as React from 'react';
import Dictionary from '../components/Dictionary';
import IFrameDialog from '../components/IFrameDialog';

export default function MapView() {

    return (
        <React.Fragment>
            <IFrameDialog 
                url={"/map/regions"} 
                title={Dictionary("frontend.menu.map", "Map")} 
            />
        </React.Fragment>
    );
}