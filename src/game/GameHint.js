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
        width: `${64 * multiplier}px`,
        height: `${16 * multiplier}px`,
        fontSize: `${8 * multiplier}px`,
        //color: '#FFFF00'
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

    return (
        <div className={classes.hintContainer}>
            <div className={classes.hint}>{hintText}</div>
        </div>
    );
};

export default GameHint;
