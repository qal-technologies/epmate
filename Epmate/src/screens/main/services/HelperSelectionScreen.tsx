//screens/main/services/HelperSelectionScreen.tsx
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
    StyleSheet,
    Text,
    FlatList,
    View,
    Animated as Anime,
    Image,
    TouchableOpacity,
    Easing,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator} from 'react-native-paper';
import {useHelpers, type HelperData} from '../../../hooks/useHelpers';
import {theme} from '../../../theme/theme';
import {MaterialIcons} from '@expo/vector-icons';
import AuthBtn from '../../../components/AuthButton';
import MyInput from '../../../components/myInput';
import Animated, {SlideInRight, SlideOutRight} from 'react-native-reanimated';
import {useDispatch} from 'react-redux';
import {setSelectedHelper} from '../../../state/slices/orderSlice';
import {useNavigation} from '@react-navigation/native';
import formatPrice from '../../../utils/formatPrice';
import ModalBackButton from '../../../components/ModalBackButton';
import {TIMEOUTS, ANIMATION_DURATIONS} from '../../../constants/timeouts';

interface HelperWithVisibility extends HelperData {
    isVisible: boolean;
    appearDelay: number;
}

// Helper Item Component - MUST be a component to use hooks
const HelperItem: React.FC<{
    item: HelperWithVisibility;
    onPress: (helper: HelperData) => void;
    onExpired?: (id: string) => void;
}> = ({item, onPress, onExpired}) => {
    const [isDisabled, setIsDisabled] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const animatedWidth = useRef(new Anime.Value(0)).current;

    useEffect(() => {
        Anime.timing(animatedWidth, {
            toValue: 1,
            duration: TIMEOUTS.HELPER_ACCEPT_DURATION,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();

        const timer = setInterval(() => {
            setCountdown(prev => {
                if(prev <= 1) {
                    setIsDisabled(true);
                    clearInterval(timer);
                    if(onExpired) {
                        // Use a ref or ensure this doesn't cause a leak if unmounted
                        // For safety, we can just call it immediately or ensure component is mounted
                        // But since we can't easily track mounted state in this functional component without a ref,
                        // we'll rely on the parent handling the callback safely.
                        // Better: use a separate useEffect for expiry if needed, but here:
                        onExpired(item.id);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            animatedWidth.stopAnimation();
        };
    }, [item.id, onExpired]); // Added dependencies


    const fillWidth = animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '170%'],
    });

    if(!item.isVisible) return null;

    return (
        <Animated.View
            style={styles.helperItem}
            entering={SlideInRight.springify().delay(ANIMATION_DURATIONS.SLIDE_IN)}
            exiting={SlideOutRight.duration(ANIMATION_DURATIONS.SLIDE_OUT).springify()}
        >
            <View style={styles.helperImage}>
                {item.image ? (
                    <Image
                        source={{uri: item.image}}
                        alt={item.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            resizeMode: 'cover',
                        }}
                    />
                ) : (
                    <MaterialIcons
                        name="verified-user"
                        color={theme.colors.primary}
                        size={30}
                    />
                )}
            </View>

            <View style={styles.helperDetails}>
                <Text style={styles.helperName}>{item.name}</Text>

                <Text style={styles.priceText}>{formatPrice(item.tagPrice)}</Text>

                <View style={styles.helperRating}>
                    <Text style={styles.ratingText}>
                        {item.rating} <MaterialIcons name="star" size={12} color="gold" />
                    </Text>
                    <Text style={styles.tasksText}>({item.totalTasks} tasks)</Text>
                </View>
                <Text style={styles.distanceText}>{item.distance} mins away</Text>
            </View>

            <View style={styles.helperPrice}>
                <TouchableOpacity
                    style={[styles.selectButton, isDisabled && styles.disabledButton]}
                    onPress={() => !isDisabled && onPress(item)}
                    activeOpacity={isDisabled ? 1 : 0.7}
                >
                    <Anime.View
                        style={{
                            width: fillWidth,
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            zIndex: 9,
                            backgroundColor: theme.colors.placeholder,
                        }}
                    />

                    <Text style={styles.selectButtonText}>ACCEPT</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const HelperSelectionScreen: React.FC = () => {
    const {isLoading, isError, helpers} = useHelpers();
    const [Offer, setOffer] = useState('');
    const [visibleHelpers, setVisibleHelpers] = useState<HelperWithVisibility[]>([]);
    const dispatch = useDispatch();
    const navigation = useNavigation<any>();

    useEffect(() => {
        if(helpers && helpers.length > 0) {
            // Development: Add staggered delays for visual effect
            const helpersWithVisibility: HelperWithVisibility[] = helpers.map(
                (helper, index) => ({
                    ...helper,
                    isVisible: false,
                    appearDelay: index * TIMEOUTS.HELPER_STAGGER_DELAY,
                })
            );

            setVisibleHelpers(helpersWithVisibility);

            helpersWithVisibility.forEach((helper) => {
                setTimeout(() => {
                    setVisibleHelpers(prev =>
                        prev.map(h => (h.id === helper.id ? {...h, isVisible: true} : h))
                    );
                }, helper.appearDelay);
            });
        }
    }, [helpers]);

    const handleSelectHelper = useCallback(
        (helper: HelperData) => {
            dispatch(setSelectedHelper(helper));
            navigation.navigate('ConfirmOrder');
        },
        [dispatch, navigation]
    );

    const handleHelperExpired = useCallback((id: string) => {
        setVisibleHelpers(prev => prev.filter(h => h.id !== id));
    }, []);


    const renderHelper = useCallback(
        ({item}: {item: HelperWithVisibility;}) => (
            <HelperItem
                item={item}
                onPress={handleSelectHelper}
                onExpired={handleHelperExpired}
            />
        ),
        [handleSelectHelper, handleHelperExpired]
    );

    const handleOffer = () => {
        // fetch api for alerting helpers around for that price
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <ModalBackButton onPress={() => navigation.navigate('MainDrawer')} title='Available Helpers' withTitle size={24} />
            </View>

            <View style={styles.content}>
                {visibleHelpers.length > 0 ? (
                    <>
                        <FlatList
                            data={visibleHelpers.filter(h => h.isVisible)}
                            contentContainerStyle={{
                                paddingTop: 10,
                                paddingBottom: 20,
                            }}
                            showsVerticalScrollIndicator={true}
                            fadingEdgeLength={50}
                            keyExtractor={item => item.id}
                            scrollEnabled={true}
                            windowSize={5}
                            maxToRenderPerBatch={10}
                            removeClippedSubviews={true}
                            initialNumToRender={5}
                            getItemLayout={(index: any) => ({
                                length: 100,
                                offset: 100 * index,
                                index,
                            })}
                            renderItem={({item}) => (
                                <HelperItem
                                    item={item}
                                    onPress={handleSelectHelper}
                                    onExpired={handleHelperExpired}
                                    key={item.id}
                                />
                            )}
                        />
                        <View
                            style={{
                                alignSelf: 'center',
                                backgroundColor: theme.colors.secondary,
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 10,
                                borderRadius: 18,
                            }}
                        >
                            <Text style={{fontSize: 14, color: 'grey', opacity: 0.9, fontStyle: 'italic', textAlign: 'center', marginTop: 10}}>
                                A higher price may attract more helpers
                            </Text>

                            <MyInput value={Offer} setValue={setOffer} placeholder='Enter your price' type='number' selectionColor={theme.colors.primary} />

                            <AuthBtn
                                btnText="SUBMIT OFFER"
                                btnStyle="solid"
                                btnMode="contained"
                                onClick={handleOffer}
                                disabled={isLoading || Offer.trim().length < 3}
                                style={{
                                    marginVertical: 10,
                                }}
                            />
                        </View>
                    </>
                ) : (
                    <View style={styles.loadingContainer}>

                        {isLoading ? (
                            <>
                                <ActivityIndicator color={theme.colors.primary} size={'large'} style={{alignSelf: 'center'}} />
                                <Text style={{fontSize: 25, color: theme.colors.primary, marginTop: 10, textAlign: 'center', fontWeight: 'bold'}}>Searching Helpers...</Text>
                            </>
                        ) : isError ? (
                            <View
                                style={{
                                    width: '100%',
                                    padding: 20,
                                    flex: 1,
                                    justifyContent: 'center',
                                    gap: 10,
                                    alignItems: 'center',
                                }}
                            >
                                <MaterialIcons
                                    name="handyman"
                                    color={theme.colors.primary}
                                    size={80}
                                />
                                <Text style={{fontSize: 25, color: theme.colors.primary, marginTop: 10, textAlign: 'center', fontWeight: 'bold'}}>
                                    Error fetching helpers
                                </Text>
                            </View>
                        ) : (
                            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                                <ActivityIndicator color={theme.colors.primary} size={'large'} style={{alignSelf: 'center'}} />
                                <Text style={{fontSize: 25, color: theme.colors.primary, marginTop: 10, textAlign: 'center', fontWeight: 'bold'}}>Searching Helpers...</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 10
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    listContainer: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: theme.colors.placeholder,
    },
    helperItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.secondary,
        borderColor: '#eee',
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    helperImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primaryTrans,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    helperDetails: {
        flex: 1,
        marginLeft: 12,
    },
    helperName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    helperRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 14,
        marginRight: 8,
    },
    tasksText: {
        fontSize: 12,
        color: theme.colors.placeholder,
    },
    distanceText: {
        fontSize: 12,
        color: theme.colors.placeholder,
        marginTop: 2,
    },
    helperPrice: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    selectButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
        overflow: 'hidden',
    },
    disabledButton: {
        opacity: 0.5,
    },
    selectButtonText: {
        color: theme.colors.secondary,
        fontWeight: 'bold',
        zIndex: 99,
    },
});

export default HelperSelectionScreen;
