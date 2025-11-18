import React from "react";
import { Text, Button } from "react-native-paper";
import { View } from "react-native";
import type { RootStackParamList } from "../../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type PolicyNavigationProps = NativeStackNavigationProp<
  RootStackParamList,
  'Policy'
>;

type Props = {
  navigation: PolicyNavigationProps;
};
const PolicyPage :React.FC<Props>= ({navigation}) => {
    return (
        <View>
            <Text>Privacy Policy here</Text>
            <Button mode="contained" onPress={()=> navigation.goBack()}>Go back</Button>
        </View>
    )
}

export default PolicyPage;