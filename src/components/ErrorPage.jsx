import FolderUpload from './FolderUpload.jsx'

export default function ErrorPage(props) {
    return (
        <>
            <h1>Error</h1>
            <p>{props.error}</p>
            <FolderUpload
                getPlayerData={props.getPlayerData}
                getWorldName={props.getWorldName}
                db={props.db}
                isLoading={props.isLoading}
                setError={props.setError}
            />
        </>
    )
}