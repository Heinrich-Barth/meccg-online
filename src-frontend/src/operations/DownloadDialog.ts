async function downloadBlob(suggestedName:string, data:Blob) {
    
    try
    {
        const downloadelem = document.createElement("a");
        const url = URL.createObjectURL(data);
        downloadelem.href = url;
        downloadelem.download = suggestedName;
        downloadelem.click();
        downloadelem.remove();
        window.URL.revokeObjectURL(url);
    }
    catch (err)
    {
        console.error(err);
    }
  }
  

export default async function DownloadDialog(data: string, suggestedName:string, types:any[]) {
    const blob = new Blob([data]);

    let writableStream = null;
    try {
        const pWindow: any = window;
        if (typeof pWindow.showSaveFilePicker === "undefined")
        {
            await downloadBlob(suggestedName, blob);
            return;
        }

        const handle = await pWindow.showSaveFilePicker({
            suggestedName: suggestedName,
            types: types,
        });

        
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