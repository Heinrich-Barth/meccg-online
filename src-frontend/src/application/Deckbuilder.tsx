

import * as React from 'react';
import Dictionary from '../components/Dictionary';
import IFrameDialog from '../components/IFrameDialog';

export default function Deckbuilder() {

    return (
        <React.Fragment>
            <IFrameDialog 
                url={"/deckbuilder"}
                title={Dictionary("frontend.menu.deck", "Deckbuilder")} 
            />
        </React.Fragment>
    );
}