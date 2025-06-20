import UploadPage from './UploadPage.jsx'
import PlayerList from './PlayerList.jsx'
import PlayerProfile from './PlayerProfile.jsx'
import { useState } from 'react'
import '../styles/App.css'

export default function App() {
	const initialPlayerData = localStorage.getItem('playerProfiles')
	const initialWorldName = localStorage.getItem('worldName')
	const [playerData, setPlayerData] = useState(initialPlayerData ? JSON.parse(initialPlayerData) : null)
	const [worldName, setWorldName] = useState(initialWorldName ? initialWorldName : null)
	const [activePlayer, setActivePlayer] = useState(null)
	const [isLoading, setIsLoading] = useState(false)

	function getPlayerDataFromStorage() {
		const storedPlayerData = localStorage.getItem('playerProfiles')
		setPlayerData(storedPlayerData ? JSON.parse(storedPlayerData) : null)
	}

	function getWorldNameFromStorage() {
		const storedWorldName = localStorage.getItem('worldName')
		setWorldName(storedWorldName ? storedWorldName : null)
	}

	function goToPlayerProfile(player) {
		setActivePlayer(player)
	}

	function toggleLoadingAnim(val) {
		setIsLoading(val)
	}

	return (
		<>
			{
				!playerData &&
				<UploadPage
					getPlayerData={getPlayerDataFromStorage}
					getWorldName={getWorldNameFromStorage}
				/>
			}
			{
				isLoading ?	
				<div className='loading-anim'></div> :
				(
					!activePlayer &&
					playerData &&
					<PlayerList
						getPlayerData={getPlayerDataFromStorage}
						getWorldName={getWorldNameFromStorage}
						playerData={playerData}
						worldName={worldName}
						getPlayer={goToPlayerProfile}
						isLoading={setIsLoading}
					/>
				)
			}
			{
				activePlayer &&
				<PlayerProfile
					getPlayerData={getPlayerDataFromStorage}
					getWorldName={getWorldNameFromStorage}
					player={activePlayer}
					resetPlayer={goToPlayerProfile}
				/>
			}
		</>
	)
}

