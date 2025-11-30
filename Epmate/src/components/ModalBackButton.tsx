import React from 'react';
import {Text} from "react-native-paper";
import {StyleSheet, TouchableOpacity, View} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import {useNavigation} from '@react-navigation/native';
import {theme} from '../theme/theme';

type ButtonTypes = {
    withTitle?: boolean;
    titleOnly?: boolean;
    withBg?: boolean;
    title?: string;
    onPress?: () => void;
    size?: number;
    color?: string;
};

const ModalBackButton: React.FC<ButtonTypes> = ({
    onPress,
    title,
    titleOnly,
    withTitle,
    withBg = true,
    size = 22,
    color = theme.colors.text
}) => {
    const navigation = useNavigation<any>();

    const handlePress = onPress || (() => navigation.goBack());

    return (

        <View style={styles.wrapper}>
            <TouchableOpacity onPress={handlePress} style={[styles.button, withBg && {backgroundColor: theme.colors.primaryTrans} ]}>
                {!titleOnly && <MaterialIcons name="arrow-back" size={size} color={color} />}
            </TouchableOpacity>
            {(withTitle || titleOnly) && title && <Text style={[styles.title, {color, fontSize: size + 2}]}>{title}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: 'auto',
        // flex:1,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        gap: 20,
        marginTop:10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'transparent',
        borderRadius: 70,
        padding: 6,
        width: 36,
        height: 36
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
    },
});

export default ModalBackButton;