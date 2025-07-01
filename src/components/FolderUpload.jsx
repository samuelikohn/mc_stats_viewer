export default function FolderUpload(props) {

    async function cleanStats(fileContent) {
        try {
            const blocks = await getRegistry('https://raw.githubusercontent.com/Ersatz77/mcdata/master/processed/reports/registries/block/data.min.json')
            const items = await getRegistry('https://raw.githubusercontent.com/Ersatz77/mcdata/master/processed/reports/registries/item/data.min.json')
            const custom = await getRegistry('https://raw.githubusercontent.com/Ersatz77/mcdata/master/processed/reports/registries/custom_stat/data.min.json')
            const entities = await getRegistry('https://raw.githubusercontent.com/Ersatz77/mcdata/master/processed/reports/registries/entity_type/data.min.json')

            const registryValues = {
                'minecraft:broken': items,
                'minecraft:crafted': items,
                'minecraft:custom': custom,
                'minecraft:dropped': items,
                'minecraft:killed': entities,
                'minecraft:killed_by': entities,
                'minecraft:picked_up': items,
                'minecraft:mined': blocks,
                'minecraft:used': items
            }

            // Set all values for all stat types to 0
            const defaultStats = {}
            for (const statType of Object.keys(registryValues)) {
                defaultStats[statType] = registryValues[statType].map(key => ({'name': key, 'value': 0}))
            }
            
            // Must be object
            if (typeof fileContent !== 'object' || Array.isArray(fileContent) || fileContent === null) {
                return defaultStats
            }

            // Must have 'stats' key
            if (!('stats' in fileContent)) {
                return defaultStats
            }

            // Iteratively build out all values, replace value with 0 if DNE
            const playerStats = {}
            for (const statType of Object.keys(registryValues)) {
                if (statType in fileContent.stats) {
                    playerStats[statType] = registryValues[statType].map(key => (
                        {
                            'name': key,
                            'value': (
                                key in fileContent.stats[statType] ?
                                fileContent.stats[statType][key] :
                                0
                            )
                        }
                    ))
                } else {
                    playerStats[statType] = defaultStats[statType]
                }
            }

            return playerStats

        } catch (error) {
            console.error('Failed to validate stats file against registries', error)
            return null
        }
    }

    function filterFiles(event) {
        const files = Array.from(event.target.files)

		// Selected folder must be world folder and file names must be valid
        const filteredFiles = files.filter(file => {
            const filePathParts = file.webkitRelativePath.split('/')
            return filePathParts.length === 3 && filePathParts[1] === 'stats' && isValidFileName(filePathParts[2])
        })
        return filteredFiles
    }

	async function getPlayerNameAndSkin(uuid) {
		try {
			const response = await fetch('/api' + uuid, {method: 'GET'})
			const data = await response.json()
            let value = ''
            for (const prop of data.properties) {
                if (prop.name === 'textures') {
                    value = prop.value
                    break
                }
            }
            return {
                'uuid': uuid,
                'name': data.name,
                'skin': JSON.parse(atob(value)).textures.SKIN.url
            }
		} catch (error) {
			console.error('Failed to fetch player data', error)
            return {
                'uuid': uuid,
                'name': uuid,
                'skin': 'src/assets/steve.png'
            }
		}
	}

    async function getRegistry(url) {
        try {
            const response = await fetch(url, {method: 'GET'})

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText}`)
            }

            const data = await response.json()
            return data.values
        } catch (error) {
            console.error('Failed to get registry from ' + url, error)
        }
    }

    function getWorldName(event) {
        try {
            return Array.from(event.target.files)[0].webkitRelativePath.split('/')[0]
        } catch (error) {
            console.error('Unable to get world name', error)
            return 'Unnamed Minecraft World'
        }
    }

    async function handleUpload(event) {
        try {

            // Start loading animation
            props.isLoading(true)

            // Clear error if exists
            props.setError("")

            // Get world name from folder name
            const worldName = getWorldName(event)

            // Only upload valid file names from valid folders
            const filteredFiles = filterFiles(event)

            // Display error if no files found
            if (filteredFiles.length === 0) {
                throw new Error('No valid stats files found')
            }

            // Get obj of stats by UUID from files
            const allStats = await uploadFiles(filteredFiles)

            // Display error if no files uploaded and parsed
            if (Object.keys(allStats).length === 0) {
                throw new Error('Failed to parse selected stats files')
            }

            // Get player profile data
            const playerProfiles = []
            for (const uuid of Object.keys(allStats)) {
                const profile = await getPlayerNameAndSkin(uuid)
                profile.stats = allStats[uuid]
                playerProfiles.push(profile)
            }

            // Data is stored in indexed DB for persistence
            await writeToDB('playerProfiles', JSON.stringify(playerProfiles))
            await writeToDB('worldName', worldName)
            props.getPlayerData()
            props.getWorldName()

            // End loading animation
            props.isLoading(false)

        } catch(error) {
            props.isLoading(false)
            props.setError(error.message)
            console.error(error)
        }
    }

    function isValidFileName(fileName) {

		// File must be JSON with 128-bit UUID name
        const pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.json$/
        return pattern.test(fileName)
    }

    function readFileAsJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                try {
                    const jsonContent = JSON.parse(event.target.result)
                    resolve(jsonContent)
                } catch (error) {
                    reject(new Error(`Error parsing JSON from ${file.name}: ${error.message}`))
                }
            }
            reader.onerror = (event) => {
                reject(event.target.error)
            }
            reader.readAsText(file)
        })
    }

	async function uploadFiles(files) {
        const fileContents = {}
        for (const file of files) {
            try {
                const fileContent = await readFileAsJSON(file)

                // Validate and construct stats data
                const cleanedStats = await cleanStats(fileContent)
                if (!cleanedStats) {
                    throw new Error('Error cleaning stats file')
                }

                // File name guaranteed to be valid from filtering paths
				const fileName = file.webkitRelativePath
				const fileKey = fileName.slice(fileName.length - 41, fileName.length - 5).replace(/-/g, '')
                fileContents[fileKey] = cleanedStats
            } catch (error) {
                console.error(`Error reading file ${file.webkitRelativePath}:`, error)
            }
        }
		return fileContents
	}

    async function writeToDB(key, value) {
        if (!props.db) {
            console.error('Database not open yet')
            return
        }

        const STORE_NAME = 'MCStatsData'
        const transaction = props.db.transaction([STORE_NAME], 'readwrite')
        const objectStore = transaction.objectStore(STORE_NAME)
        const putRequest = objectStore.put(value, key)

        putRequest.onerror = function(event) {
            console.error(`Error writing key '${key}':`, event.target.error)
        }

        transaction.onerror = function(event) {
            console.error('Transaction error:', event.target.error)
        }
    }

    return (
        <div>
            <input
                type='file'
                webkitdirectory='true'
                multiple
                onChange={handleUpload}
            />
        </div>
    )
}