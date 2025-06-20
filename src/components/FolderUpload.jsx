export default function FolderUpload(props) {

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
                'skin': "src/assets/steve.png"
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

		// Get world name from folder name
        const worldName = getWorldName(event)

		// Only upload valid file names from valid folders
		const filteredFiles = filterFiles(event)

		// Display error if no files found
        if (filteredFiles.length === 0) {
            // TODO
        }

		// Get obj of stats by UUID from files
		const allStats = await uploadFiles(filteredFiles)

		// Display error if no files uploaded and parsed
        if (Object.keys(allStats).length === 0) {
            // TODO
        }

		// Get player profile data
		const playerProfiles = []
		for (const uuid of Object.keys(allStats)) {
            const profile = await getPlayerNameAndSkin(uuid)
            profile.stats = allStats[uuid]
			playerProfiles.push(profile)
		}

		// Data is stored in local storage for persistence
		localStorage.setItem('playerProfiles', JSON.stringify(playerProfiles))
		localStorage.setItem('worldName', worldName)
        props.getPlayerData()
        props.getWorldName()
    }

    function isValidFileName(fileName) {

		// File must be JSON with 128-bit UUID name
        const pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.json$/
        return pattern.test(fileName)
    }

    async function constructStats(obj) {
        try {
            const blocks = await getRegistry('https://raw.githubusercontent.com/Ersatz77/mcdata/master/processed/reports/registries/block/data.min.json')
            const items = await getRegistry('https://raw.githubusercontent.com/Ersatz77/mcdata/master/processed/reports/registries/item/data.min.json')
            const statTypes = await getRegistry('https://raw.githubusercontent.com/Ersatz77/mcdata/master/processed/reports/registries/stat_type/data.min.json')
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
                'minecraft:used':items
            }
            
            if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
                return false
            }

            if (!('stats' in obj)) {
                return false
            }

            for (const statType of Object.keys(obj.stats)) {
                if (!statTypes.includes(statType)) {
                    return false
                }

                for (const stat of Object.keys(obj.stats[statType])) {
                    if (!registryValues[statType].includes(stat) || !Number.isInteger(obj.stats[statType][stat])) {
                        delete obj.stats[statType][stat]
                    }
                }
            }

            return true

        } catch (error) {
            console.error('Failed to validate stats file against registries', error)
            return false
        }
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

                // Validate contents against schema
                if (!await constructStats(fileContent)) {
                    throw new Error('Error: Invalid JSON schema')
                }

                // File name guaranteed to be valid from filtering paths
				const fileName = file.webkitRelativePath
				const fileKey = fileName.slice(fileName.length - 41, fileName.length - 5).replace(/-/g, '')
                fileContents[fileKey] = fileContent.stats
            } catch (error) {
                console.error(`Error reading file ${file.webkitRelativePath}:`, error)
            }
        }
		return fileContents
	}

    return (
        <div>
            <input
                type='file'
                webkitdirectory='true'
                multiple
                onChange={handleUpload}
            />
            {/* TODO 
                on upload prevent file alert
                do not erase storage on cancel
                loading animation
                when validating stats, if stat type or key DNE, replace with 0's
                ad skin overlay on top
            */}
        </div>
    )
}