import {Text, ActivityIndicator} from "react-native-paper";
import {StyleSheet, TouchableOpacity} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";

type ButtonTypes = {
    withTitle?: boolean;
    titleOnly?: boolean;
    title?: string;
    onPress: () => void;
    size?: number
};

const BackButton: React.FC<ButtonTypes> = ({onPress, title, titleOnly, withTitle, size}) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            {!titleOnly && <MaterialIcons name="arrow-back" size={size || 16}/>}
            {withTitle || titleOnly && title && <Text>{title}</Text>}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    }
})
export default BackButton;