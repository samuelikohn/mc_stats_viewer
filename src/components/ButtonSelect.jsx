export default function ButtonSelect(props) {

    function handleButtonClick(id) {
        if (props.currentStat !== id) {
            props.setCurrentStat(id)
        }
    }

    return (
        <>
            {props.buttons.map((button) => (
                <button
                    key={button.id}
                    onClick={() => handleButtonClick(button.id)}
                >
                    {button.label}
                </button>
            ))}
        </>
    )
}
