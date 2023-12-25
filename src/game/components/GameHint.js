import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    hintContainer: ({ multiplier, width }) => {
        const left = window.innerWidth - (width * multiplier);
        return {
            imageRendering: 'pixelated',
            position: 'absolute',
            top: `${16 * multiplier}px`,
            left: `${(16 * multiplier) + left / 2}px`,
            display: 'flex',
        };
    },
    hint: ({ multiplier, width }) => ({
        width: `${256 * multiplier}px`,
        height: `${16 * multiplier}px`,
        fontSize: `${8 * multiplier}px`,
        cursor: 'pointer'
        //color: '#FFFF00'
    }),
    button: ({ multiplier }) => ({
        fontSize: `${6 * multiplier}px`,
        cursor: 'pointer',
        textAlign: 'center',
        position: 'absolute',
        left: `${1 * multiplier}px`,
        top: `${13 * multiplier}px`
    }),
    button1: ({ multiplier }) => ({
        fontSize: `${6 * multiplier}px`,
        cursor: 'pointer',
        textAlign: 'center',
        position: 'absolute',
        left: `${1 * multiplier}px`,
        top: `${27 * multiplier}px`
    }),
}));


const GameHint = ({
    gameSize,
    hintText,
}) => {
    const {
        width,
        height,
        multiplier,
    } = gameSize;

    const classes = useStyles({
        width,
        height,
        multiplier,
    });

    const handleButtonClick = () => {
        const customEvent = new CustomEvent('heroRandomMove', {});
        window.dispatchEvent(customEvent);
    };

    const handleButton1Click = () => {
        const customEvent = new CustomEvent('topicDialog', {});
        window.dispatchEvent(customEvent);
    };

    const handleLinkClick = () => {
        window.open('https://github.com/git-cloner/ai-town', '_blank');
    }

    return (
        <div className={classes.hintContainer}>
            <div className={classes.hint} onClick={handleLinkClick}>{hintText}</div>
            <button onClick={handleButtonClick} className={classes.button}>随便走走</button>
            <button onClick={handleButton1Click} className={classes.button1}>设置话题</button>
        </div>
    );
};

export default GameHint;
