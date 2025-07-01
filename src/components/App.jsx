import UploadPage from './UploadPage.jsx'
import PlayerList from './PlayerList.jsx'
import PlayerProfile from './PlayerProfile.jsx'
import { useState, useEffect } from 'react'
import '../styles/App.css'

export default function App() {
	const [database, setDatabase] = useState(null)
	const [playerData, setPlayerData] = useState(null)
	const [worldName, setWorldName] = useState(null)
	const [activePlayer, setActivePlayer] = useState(null)
	const [isLoading, setIsLoading] = useState(false)

	async function getPlayerDataFromStorage() {
		const storedPlayerData = await readFromDB('playerProfiles')
		setPlayerData(storedPlayerData ? JSON.parse(storedPlayerData) : null)
	}

	async function getWorldNameFromStorage() {
		const storedWorldName = await readFromDB('worldName')
		setWorldName(storedWorldName ? storedWorldName : null)
	}

	function goToPlayerProfile(player) {
		setActivePlayer(player)
	}

	function initDB() {
		const DB_NAME = 'MCStatsDB'
		const DB_VERSION = 1
		const STORE_NAME = 'MCStatsData'

		let db
		const request = indexedDB.open(DB_NAME, DB_VERSION)

		request.onerror = function(event) {
			console.error('Error opening database:', event.target.errorCode)
		}

		request.onsuccess = function(event) {
			db = event.target.result

			// Store reference to DB
			setDatabase(db)
		}

		request.onupgradeneeded = function(event) {
			db = event.target.result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME)
			}

			// Store reference to DB
			setDatabase(db)
		}
	}

	async function readFromDB(key) {
		return new Promise((resolve, reject) => {
			if (!database) {
				reject('Database not open yet')
				return
			}

			const STORE_NAME = 'MCStatsData'
			const transaction = database.transaction([STORE_NAME], 'readonly')
			const objectStore = transaction.objectStore(STORE_NAME)
			const getRequest = objectStore.get(key)

			getRequest.onsuccess = function(event) {
				const result = event.target.result
				if (result !== undefined) {
					resolve(result)
				} else {
					resolve(undefined)
				}
			}

			getRequest.onerror = function(event) {
				console.error(`Error reading key '${key}':`, event.target.error)
				reject(event.target.error)
			}

			transaction.onerror = function(event) {
				console.error('Transaction error:', event.target.error)
			}
		})
	}

	// Init DB on app load
	useEffect(() => {initDB()}, [])

	// On DB init, load data into state
	useEffect(() => {
		if (database) {
			getPlayerDataFromStorage()
			getWorldNameFromStorage()
		}
	}, [database])

	return (
		<>
			{
				!playerData &&
				database &&
				<UploadPage
					getPlayerData={getPlayerDataFromStorage}
					getWorldName={getWorldNameFromStorage}
					isLoading={setIsLoading}
					db={database}
				/>
			}
			{
				isLoading ?	
				<div className='loading-anim'></div> :
				(
					!activePlayer &&
					playerData &&
					database &&
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
				database &&
				<PlayerProfile
					getPlayerData={getPlayerDataFromStorage}
					getWorldName={getWorldNameFromStorage}
					isLoading={setIsLoading}
					player={activePlayer}
					resetPlayer={goToPlayerProfile}
				/>
			}
		</>
	)
}