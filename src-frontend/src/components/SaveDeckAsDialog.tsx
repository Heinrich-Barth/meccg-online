import DownloadDialog from "../operations/DownloadDialog";


export default async function SaveDeckDialog(data: string) {
    await DownloadDialog(
        data,
        'deck.meccg',
        [{
            description: 'Deck file',
            accept: { 'text/plain': ['.meccg'] },
        }]
    )
}
