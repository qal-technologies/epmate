import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function useOtp(userInfo: { id: string, destination: string | number }, navigation:any, /**minimum of 4 digits*/max = 4) {
    if (!userInfo.destination) return;
    const checkType = () => {
        if (typeof userInfo.destination == 'number')
            return 'mobile'
        else if (typeof userInfo.destination == 'string' && userInfo.destination.includes('@')) return 'email';
        else return 'default';
    }

    const type = checkType();
    max = max <= 3 ? 4 : max;

    const genRandom = Math.random() * Date.now() + max;

    const randomCode1 = Math.floor(Math.random() * 100000 + genRandom)

    const randomCode2 = Math.floor(Math.random() * 200000 * max % 2 * genRandom);

    const randomArray = [randomCode1, randomCode2];

    const lastReturn = `${randomArray.slice(1, max / 2)}${randomArray.slice(max, max / 2)
        }`;

    const otp = lastReturn.substring(1, max + 1).normalize() as any;


    Alert.alert('OTP CODE', `Here is your OTP: ${otp}`);

    navigation.replace('otp', { userId: '12345', otp: otp, 
        mobile: userInfo.destination,
    });
    
    return otp;
}