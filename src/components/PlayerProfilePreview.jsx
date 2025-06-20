import '../styles/PlayerProfilePreview.css'

export default function PlayerProfilePreview(props) {

    return (
        <div className='player-profile' onClick={() => props.getPlayer(props.player)}>
            <p>{props.player.name}</p>
            <div className='profile-picture'>
                <img src={props.player.skin} alt={props.player.name}/>
            </div>
        </div>
    )
}