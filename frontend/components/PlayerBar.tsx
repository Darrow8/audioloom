import TrackPlayer, { useProgress } from 'react-native-track-player';
import { View, Text } from 'react-native';
import * as Progress from 'react-native-progress';


export const PlayerBar = () => {
    // TODO: add real things
    let pos = 0.6;
    let time = '5:25';
    return (
            // Note: formatTime and ProgressBar are just examples:
            <View>
                <Text>{time}</Text>
                <Progress.Bar
                    progress={pos}
                />
            </View>
        );

}