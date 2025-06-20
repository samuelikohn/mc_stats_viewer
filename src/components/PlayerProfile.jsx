import FolderUpload from './FolderUpload.jsx'
import ButtonSelect from './ButtonSelect.jsx'
import { useState } from 'react'
import { BarChart, Bar } from 'recharts'
import * as ScrollArea from "@radix-ui/react-scroll-area"
import '../styles/PlayerProfile.css'

export default function PlayerProfile(props) {
    const [currentStat, setCurrentStat] = useState(null)

    const statButtons = [
        {id: 'minecraft:mined', label: 'Blocks Mined'},
        {id: 'minecraft:used', label: 'Items Used'},
        {id: 'minecraft:crafted', label: 'Item Crafted'},
        {id: 'minecraft:broken', label: 'Items Broken'},
        {id: 'minecraft:dropped', label: 'Items Dropped'},
        {id: 'minecraft:picked_up', label: 'Items Picked Up'},
        {id: 'minecraft:killed', label: 'Mobs Killed'},
        {id: 'minecraft:killed_by', label: 'Killed by Mobs'},
        {id: 'minecraft:custom', label: 'Miscellaneous'},
    ]

    return (
        <>
            <button onClick={() => props.resetPlayer(null)}>Back to Player List</button>
            <FolderUpload
                getPlayerData={props.getPlayerData}
                getWorldName={props.getWorldName}
            />
            <h1>View {props.player.name}'s stats</h1>
            <ButtonSelect
                buttons={statButtons}
                currentStat={currentStat}
                setCurrentStat={setCurrentStat}
            />

            <ScrollArea.Root className='scroll-area-root'>
                <ScrollArea.Viewport className='scroll-area-viewport'>
                    {
                        currentStat &&
                        <BarChart
                            width={1000 * currentStat.length}
                            height={500}
                            data={
                                Object
                                .entries(props.player.stats[currentStat])
                                .map(([name, value]) => ({name, value}))
                                .sort((a, b) => {
                                    return b.value - a.value
                                })
                            }
                        > 
                            <Bar dataKey='value' fill='#8932b8'/>
                        </BarChart>
                    }
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar className='scroll-area-scrollbar' orientation='horizontal'>
                    <ScrollArea.Thumb className='scroll-area-thumb'/>
                </ScrollArea.Scrollbar>
                <ScrollArea.Corner className='scroll-area-corner'/>
            </ScrollArea.Root>
        </>
    )
}

/*
const icon = await getItemIcon("debug_stick") // you can include namespace too
async function getItemIcon(item_id) {
    let final = item_id.replace(/^\w+:/, "").split("_");
    final = final
        .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
        .join("_");

    const pngUrl = `https://minecraft.wiki/w/Special:FilePath/${final}.png`;
    const pngResponse = await fetch(pngUrl);

    if (pngResponse.ok) {
        return pngResponse.url;
    }

    const gifUrl = `https://minecraft.wiki/w/Special:FilePath/${final}.gif`;
    const gifResponse = await fetch(gifUrl);

    if (gifResponse.ok) {
        return gifResponse.url;
    }

    throw new SyntaxError(`'${item_id}' is not a valid item id.`);
}
*/