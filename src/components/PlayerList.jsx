import FolderUpload from './FolderUpload.jsx'
import PlayerProfilePreview from "./PlayerProfilePreview.jsx"

export default function PlayerList(props) {
    return (
        <>
			<FolderUpload
                getPlayerData={props.getPlayerData}
                getWorldName={props.getWorldName}
                db={props.db}
                isLoading={props.isLoading}
                setError={props.setError}
			/>
            <h1>View player stats for {props.worldName}</h1>
            {
                props.playerData.map(player =>
                    <PlayerProfilePreview
                        key={player.uuid}
                        player={player}
                        getPlayer={props.getPlayer}
                    />
                )
            }
        </>
    )
}