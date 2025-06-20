import FolderUpload from './FolderUpload.jsx'

export default function UploadPage(props) {
    return (
        <>
            <h1>Get Started</h1>
            <FolderUpload
                getPlayerData={props.getPlayerData}
                getWorldName={props.getWorldName}
            />
        </>
    )
}

