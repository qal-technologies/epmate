import React from 'react';
import {Text, View, StyleSheet, Image, TouchableOpacity, Linking, TextInput} from 'react-native';
import {Modal, Portal} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {FontAwesome, MaterialIcons} from '@expo/vector-icons';
import {theme} from 'theme/theme';
import type {HelperData} from 'hooks/useHelpers';
import AuthBtn from 'components/AuthButton';
import useTaskName from 'hooks/useServiceType';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {commonStyles, borderRadius, spacing, fontSize} from 'styles/commonStyles';


export default function HelperDetails ({forTracking = false}: {forTracking?: boolean;}) {
    const navigation = useNavigation<any>();
    const [showCallModal, setShowCallModal] = React.useState(false);
    const [showIssue, setShowIssue] = React.useState(false);

    const {selectedHelper: helper, locationData} = useSelector((state: any) => state.order);

    if(!helper) return null;

    const selectedHelper: HelperData = helper;
    const serviceType = useTaskName();

    const handlePhoneCall = () => {
        setShowCallModal(false);
        const phoneNumber = selectedHelper.phone || '1234567890';
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleInAppCall = () => {
        setShowCallModal(false);
        navigation.replace('CallPage');
    };

    if(forTracking) {
        const arrivalTime = '5';
        const arrivalPlace = 'Pickup Location';
        const [selectedIssue, setIssue] = React.useState('');
        const [typedIssue, setTypedIssue] = React.useState('');
        const issues = [
            'Helper asked me to cancel',
            'Helper was rude or unprofessional',
            'Helper delayed response',
            'Wrong address entered',
            'No longer need the service',
            'Found someone else to help',
            'Safety concerns',
            'Item/store no longer available',
            'other',
        ];

        return (
            <>
                <Portal >
                    <Modal
                        visible={showCallModal}
                        onDismiss={() => setShowCallModal(false)}
                        contentContainerStyle={commonStyles.modalContentFull}
                    >
                        <TouchableOpacity style={commonStyles.modalCloseButton}
                            onPress={() => setShowCallModal(false)}
                        >
                            <MaterialIcons name='cancel' color={theme.colors.gray} size={25} />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Contact options</Text>
                        <Text style={[commonStyles.subtitle, {textAlign: 'left', marginBottom: spacing.xl}]}>Carrier rates may apply</Text>

                        <TouchableOpacity
                            style={[styles.modalBtn]}
                            onPress={handleInAppCall}
                        >
                            <MaterialIcons name="phone-in-talk" size={24} color={theme.colors.primary} />
                            <Text style={[styles.modalBtnText]}>Call helper in-app</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalBtn} onPress={handlePhoneCall}>
                            <MaterialIcons name="phone" size={24} color={theme.colors.primary} />
                            <Text style={styles.modalBtnText}>Call driver by phone</Text>
                        </TouchableOpacity>

                    </Modal>
                </Portal>

                <Portal >
                    <Modal
                        visible={showIssue}
                        onDismiss={() => setShowIssue(false)}
                        contentContainerStyle={[commonStyles.modalContentFull, {paddingBottom: spacing.xl, minHeight: '100%', justifyContent: 'flex-start'}]}
                        dismissable={false}
                    >
                        <TouchableOpacity style={[commonStyles.modalCloseButton, {left: spacing.xl, right: 'auto'}]}
                            onPress={() => setShowIssue(false)}
                        >
                            <MaterialIcons name='cancel' color={theme.colors.gray} size={25} />
                        </TouchableOpacity>

                        <Text style={[styles.modalTitle, {marginTop: 50, marginBottom: 5}]}>What went wrong?</Text>
                        <View style={{
                            marginBottom: 20,
                        }}>
                            {
                                issues.map(issue => {
                                    return <TouchableOpacity
                                        key={issue}
                                        style={{
                                            width: '100%',
                                            flexDirection: 'row',
                                            gap: 10,
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 12,
                                            borderBottomColor: theme.colors.placeholder,
                                            borderBottomWidth: issue === 'other' ? 0 : 1,
                                        }}
                                        onPress={() => setIssue(issue)}>
                                        <Text style={{
                                            fontSize: 18
                                        }}>{issue}</Text>

                                        {issue !== 'other' ? <FontAwesome name={issue === selectedIssue ? 'circle' : 'circle-o'} color={theme.colors.primary} size={18} /> : <MaterialIcons name='chevron-right' color={theme.colors.placeholder} size={16} />}
                                    </TouchableOpacity>;
                                })
                            }

                            {
                                selectedIssue === 'other' &&
                                <TextInput placeholder='Describe what went wrong' style={[
                                    commonStyles.card,
                                    {
                                        borderColor: theme.colors.placeholder,
                                        borderWidth: 1,
                                        minHeight: 50,
                                        maxHeight: 100
                                    }
                                ]}
                                    value={typedIssue} onChangeText={setTypedIssue} multiline />
                            }
                        </View>
                        <AuthBtn btnText='DONE' btnMode='contained' btnStyle='solid' mv onClick={() => setShowIssue(false)} style={{
                            position: 'absolute',
                            bottom: 20,
                            alignSelf: 'center',
                        }} rounded/>
                    </Modal>
                </Portal>

                <View style={[styles.card, {
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: {width: 2, height: 2},
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    zIndex: 99,
                    borderStartStartRadius: 25, borderEndStartRadius: 25, marginBottom: 0
                }]}>

                    <View style={commonStyles.avatarLarge} key={selectedHelper.id}>
                        {selectedHelper.image ? (
                            <Image
                                source={{uri: selectedHelper.image}}
                                style={styles.Image}
                                alt={selectedHelper.name}
                            />
                        ) : (
                            <MaterialIcons
                                name='verified-user'
                                size={40}
                                color={theme.colors.primary}
                            />
                        )}
                    </View>

                    <View style={{flex: 1, minWidth: '60%', alignSelf: 'center'}}>
                        <Text style={[styles.title, {fontSize: 18}]}>Your Helper is On The Way</Text>

                        <Text style={[styles.name, {fontSize: 22}]}>{selectedHelper.name}</Text>

                        <Text style={{color: theme.colors.placeholder}}>
                            {selectedHelper.totalTasks} tasks completed
                        </Text>
                    </View>

                    <View style={{flex: 1, minWidth: '100%', marginVertical: 1}}>
                        <Text style={{
                            fontWeight: 'bold',
                            fontSize: 20,
                            color: theme.colors.text,
                        }}>Arriving in: {arrivalTime} mins</Text>
                        <Text style={{
                            fontWeight: 'light',
                            fontSize: 14,
                            color: theme.colors.placeholder,
                        }}>Arriving at {arrivalPlace}</Text>
                    </View>

                    <View style={{width: '100%'}}>
                        <TouchableOpacity
                            onPress={() => setShowCallModal(true)}
                            style={[styles.callBtn, {width: '100%', padding: 10, alignSelf: 'center'}]}
                        >
                            <MaterialIcons name='call' color={theme.colors.secondary} size={16} />
                            <Text style={{fontSize: 14, color: theme.colors.secondary, fontWeight: 'bold'}}>
                                Call Helper
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, {marginBottom: 0, padding: 0, paddingVertical: 5}]}>
                        <TouchableOpacity style={{
                            width: '100%',
                            paddingVertical: 6,
                            flexDirection: 'row',
                            gap: 10,
                        }}>
                            <MaterialIcons name='ios-share' size={18} color={theme.colors.placeholder} />

                            <Text style={{
                                fontSize: 16,
                                color: theme.colors.text,
                                fontWeight: 'bold',
                            }}>Share task details</Text>

                            <MaterialIcons name='chevron-right' color={theme.colors.placeholder} size={20} style={{
                                position: 'absolute',
                                alignSelf: 'center',
                                right: 0
                            }} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                width: '100%',
                                paddingVertical: 6,
                                flexDirection: 'row',
                                gap: 10,
                            }}
                            onPress={() => setShowIssue(true)}
                        >
                            <MaterialIcons name='cancel' size={20} color={theme.colors.placeholder} />

                            <Text style={{
                                fontSize: 16,
                                color: theme.colors.text,
                                fontWeight: 'bold',
                            }}>Cancel task</Text>

                            <MaterialIcons name='chevron-right' color={theme.colors.placeholder} size={20} style={{
                                position: 'absolute',
                                alignSelf: 'center',
                                right: 0
                            }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </>
        );
    }

    return (
        <Animated.View style={styles.container} entering={FadeInDown.springify()}>
            <Portal >
                <Modal
                    visible={showCallModal}
                    onDismiss={() => setShowCallModal(false)}
                    contentContainerStyle={styles.modalContent}
                >
                    <TouchableOpacity style={commonStyles.modalCloseButton}
                        onPress={() => setShowCallModal(false)}
                    >
                        <MaterialIcons name='cancel' color={theme.colors.gray} size={25} />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>Contact options</Text>
                    <Text style={[commonStyles.subtitle, {textAlign: 'left', marginBottom: spacing.xl}]}>Carrier rates may apply</Text>

                    <TouchableOpacity
                        style={[styles.modalBtn]}
                        onPress={handleInAppCall}
                    >
                        <MaterialIcons name="phone-in-talk" size={24} color={theme.colors.primary} />
                        <Text style={[styles.modalBtnText]}>Call helper in-app</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalBtn} onPress={handlePhoneCall}>
                        <MaterialIcons name="phone" size={24} color={theme.colors.primary} />
                        <Text style={styles.modalBtnText}>Call driver by phone</Text>
                    </TouchableOpacity>

                </Modal>
            </Portal>

            <View style={styles.card}>
                <Text style={styles.title}>Your Helper</Text>

                <View style={commonStyles.avatarLarge} key={selectedHelper.id}>
                    {selectedHelper.image ? (
                        <Image
                            source={{uri: selectedHelper.image}}
                            style={styles.Image}
                            alt={selectedHelper.name}
                        />
                    ) : (
                        <MaterialIcons
                            name='verified-user'
                            size={40}
                            color={theme.colors.primary}
                        />
                    )}
                </View>

                <View style={{flex: 1}}>
                    <Text style={styles.name}>{selectedHelper.name}</Text>
                    <Text style={[styles.rating, {fontWeight: 'bold'}]}>
                        Rating: <Text style={styles.rating}>{selectedHelper.rating} / 5</Text>
                    </Text>

                    <Text style={{color: theme.colors.placeholder}}>
                        {selectedHelper.totalTasks} tasks completed
                    </Text>

                    <View style={{width: '100%'}}>
                        <TouchableOpacity
                            onPress={() => setShowCallModal(true)}
                            style={styles.callBtn}
                        >
                            <MaterialIcons name='call' color={theme.colors.secondary} size={16} />
                            <Text style={{fontSize: 14, color: theme.colors.secondary, fontWeight: 'bold'}}>
                                Call Helper
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={[styles.sub, {color: theme.colors.text, fontWeight: 'bold'}]}>
                    Task Type: <Text style={styles.sub}>{serviceType}</Text>
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.title}>{serviceType}</Text>

                {serviceType.toLowerCase().includes('pickup') && (
                    <>
                        <View style={styles.typeWrapper}>
                            <MaterialIcons name='location-pin' color={theme.colors.accent} size={25} />
                            <View>
                                <Text style={styles.typeTitle}>Pickup Location:</Text>
                                <Text style={styles.typeValue}>{locationData?.pickupLocation}</Text>
                            </View>
                        </View>

                        <View style={styles.typeWrapper}>
                            <MaterialIcons name='check-circle' color={theme.colors.primary} size={25} />
                            <View>
                                <Text style={styles.typeTitle}>Delivery Location:</Text>
                                <Text style={styles.typeValue}>{locationData?.deliveryLocation}</Text>
                            </View>
                        </View>
                    </>
                )}
            </View>

            <AuthBtn
                btnText='View Live Map'
                btnStyle='solid'
                btnMode='contained'
                onClick={() => navigation.replace('LiveTracking')}
                style={styles.fullWidth}
            />

            <Text style={styles.footerText}>
                You can find this order in your 'My Tasks' history
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: spacing.xl,
    },
    title: {
        ...commonStyles.title,
        minWidth: '100%'
    },
    card: {
        ...commonStyles.card,
        backgroundColor: theme.colors.background,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md - 2,
    },
    Avatar: {
        width: 80,
        height: 80,
        backgroundColor: theme.colors.primaryTrans,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    Image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    name: {
        fontWeight: 'bold',
        fontSize: fontSize.xl,
    },
    rating: {
        fontWeight: '300',
        fontSize: fontSize.sm,
    },
    callBtn: {
        ...commonStyles.primaryButton,
        width: 'auto',
        alignSelf: 'flex-start',
        borderRadius: borderRadius.medium + 1,
        padding: spacing.sm,
        paddingHorizontal: spacing.md - 2,
        flexDirection: 'row',
        gap: spacing.md + 1,
        marginTop: spacing.sm,
    },
    sub: {
        ...commonStyles.subtitle,
    },
    typeWrapper: {
        ...commonStyles.row,
        width: '100%',
        gap: spacing.md - 2,
        marginBottom: spacing.xs + 2,
    },
    typeTitle: {
        fontWeight: 'bold',
        fontSize: fontSize.lg,
        opacity: 0.9
    },
    typeValue: {
        fontWeight: '300',
        fontSize: fontSize.md,
        color: theme.colors.placeholder,
    },
    footerText: {
        fontSize: fontSize.xs,
        color: theme.colors.placeholder,
        textAlign: 'center',
        marginTop: spacing.sm - 1,
    },
    modalContent: {
        backgroundColor: theme.colors.secondary,
        padding: 20,
        paddingTop: 30,
        width: '100%',
        borderRadius: 12,
        bottom: 0,
        position: 'absolute',
        borderStartStartRadius: 25,
        borderEndStartRadius: 25,
    },
    modalTitle: {
        fontSize: fontSize.xxl + 1,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 1,
    },
    modalBtn: {
        ...commonStyles.row,
        padding: spacing.lg - 1,
        borderRadius: borderRadius.medium - 2,
        width: '100%',
        gap: spacing.md,
    },
    modalBtnText: {
        color: theme.colors.text,
        fontSize: fontSize.md,
        fontWeight: 'bold',
    },
    helperTasksCompleted: {
        color: theme.colors.placeholder
    },
    issuesContainer: {
        marginBottom: 20,
    },
    issueItem: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomColor: theme.colors.placeholder,
    },
    issueText: {
        fontSize: 16,
    },
    otherInput: {
        borderColor: theme.colors.placeholder,
        borderWidth: 1,
        minHeight: 50,
        maxHeight: 100,
    },
    trackingCard: {
        ...commonStyles.card,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 2, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 99,
        borderStartStartRadius: 25,
        borderEndStartRadius: 25,
        marginBottom: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md - 2,
    },
    helperInfoContainer: {
        flex: 1,
        minWidth: '60%',
        alignSelf: 'center'
    },
    trackingTitle: {
        ...commonStyles.title,
        fontSize: 18,
        minWidth: '100%'
    },
    trackingName: {
        fontWeight: 'bold',
        fontSize: 22,
    },
    arrivalContainer: {
        flex: 1,
        minWidth: '100%',
        marginVertical: 1
    },
    arrivalTime: {
        fontWeight: 'bold',
        fontSize: 20,
        color: theme.colors.text,
    },
    arrivalPlace: {
        fontWeight: '300', // Note: 'light' is not a valid fontWeight in RN, using '300'
        fontSize: 14,
        color: theme.colors.placeholder,
    },
    fullWidth: {
        width: '100%',
        alignSelf: 'center',
        marginTop: 10,
    },
    trackingCallBtn: {
        fontSize: 14,
        color: theme.colors.secondary,
        fontWeight: 'bold'
    },
    actionButtonsCard: {
        ...commonStyles.card,
        marginBottom: 0,
        padding: 0,
        paddingVertical: 5,
        backgroundColor: theme.colors.background,
    },
    actionButton: {
        width: '100%',
        paddingVertical: 6,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 10, 
    },
    actionButtonText: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    chevronRight: {
        position: 'absolute',
        alignSelf: 'center',
        right: 10 
    }
});