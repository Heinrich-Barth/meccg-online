

export default async function SaveDeckDialog(data: string) {
    let writableStream = null;
    try {
        const pWindow: any = window;
        const handle = await pWindow.showSaveFilePicker({
            suggestedName: 'deck.meccg',
            types: [{
                description: 'Deck file',
                accept: { 'text/plain': ['.meccg'] },
            }],
        });

        const blob = new Blob([data]);
        writableStream = await handle.createWritable();
        await writableStream.write(blob);
    }
    catch (err) {
        console.error(err);
    }

    try {
        if (writableStream !== null)
            await writableStream.close();
    }
    catch (err) {
        console.error(err);
    }

}
