import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Shadows, BorderRadius, Spacing } from '@/shared';
import {
    downloadModel,
} from '@/features/ai';
import { setOfflineModelPath } from '@/features/ai';
import { setOfflineMode } from '@/features/user';
import { llamaBridge } from '@/features/ai';
import { initializeDatabase } from '@/core';

export default function SetupChoiceScreen() {
    const router = useRouter();
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [selectedModelName, setSelectedModelName] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const modelChoices = [
        {
            id: 'qwen-2.5-1.5b-q4',
            name: 'Qwen 2.5 (1.5B)',
            variant: 'Q4_K_M',
            size: '~940 MB',
            summary: 'Better overall understanding and explanation quality.',
            color: '#10B981',
            bg: '#F0FDF4',
            badge: 'Recommended',
            icon: 'sparkles-outline' as const,
        },
        {
            id: 'llama-3.2-1b-q5',
            name: 'Llama 3.2 (1B)',
            variant: 'Q5_K_S',
            size: '~800 MB',
            summary: 'Smaller download and faster response on lower-end devices.',
            color: '#2563EB',
            bg: '#EFF6FF',
            badge: 'Fast',
            icon: 'flash-outline' as const,
        },
    ];

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleRunOnline = async () => {
        await setOfflineMode(false);
        router.replace('/(tabs)/dashboard');
    };

    const handleDownloadModel = async (modelId: string, modelName: string, modelSize: string) => {
        setDownloading(true);
        setSelectedModelName(modelName);
        setStatusText('Preparing storage...');

        try {
            await initializeDatabase();

            setStatusText('Connecting to cloud...');
            const modelPath = await downloadModel(modelId, (p: number) => {
                setProgress(p);
                if (p < 0.1) setStatusText('Starting download...');
                else if (p < 0.5) setStatusText(`Downloading... ${(p * 100).toFixed(0)}%`);
                else if (p < 0.9) setStatusText(`Almost there... ${(p * 100).toFixed(0)}%`);
                else setStatusText('Verifying file...');
            });

            setStatusText('Configuring AI Engine...');
            setOfflineModelPath(modelPath);
            await setOfflineMode(true); // force offline mode

            try {
                await llamaBridge.ensure(modelPath);
            } catch (e) {
                // May fail if running on Expo Go without native modules, but that's fine
            }

            setStatusText('Ready! 🎉');
            setTimeout(() => {
                router.replace('/(tabs)/dashboard');
            }, 800);

        } catch (err) {
            console.error('Download failed:', err);
            setDownloading(false);
            setProgress(0);
            setSelectedModelName('');
            Alert.alert(
                'Download Failed',
                'Could not download the model. Please check your internet connection or use the Cloud option instead.'
            );
        }
    };

    if (downloading) {
        return (
            <LinearGradient colors={['#4F46E5', '#6366F1', '#818CF8']} style={styles.container}>
                <SafeAreaView style={styles.safeCentered}>
                    <View style={styles.logoBg}>
                        <MaterialIcons name="cloud-download" size={64} color="#4F46E5" />
                    </View>
                    <Text style={styles.downloadTitle}>Downloading {selectedModelName || 'AI Brain'}</Text>
                    <Text style={styles.downloadSubtitle}>
                        Saving to your phone for 100% offline use.
                    </Text>

                    <View style={styles.progressCard}>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(progress * 100, 100))}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{statusText}</Text>
                        {progress > 0 && progress < 1 && (
                            <Text style={styles.sizeHint}>Keep this screen open until completion</Text>
                        )}
                    </View>

                    <View style={styles.tipContainer}>
                        <Ionicons name="information-circle" size={18} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.tipText}>
                            Keep the app open and connected to Wi-Fi. It runs without internet once done.
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#F8FAFC', '#E2E8F0']} style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="psychology" size={48} color="#4F46E5" />
                        </View>
                        <Text style={styles.title}>Choose Your AI Engine</Text>
                        <Text style={styles.subtitle}>
                            Run online instantly or download one model for offline use.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.optionCard, { borderColor: '#3B82F6', borderWidth: 2 }]}
                        onPress={handleRunOnline}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#EFF6FF' }]}> 
                            <Ionicons name="cloud-outline" size={32} color="#3B82F6" />
                        </View>
                        <View style={styles.optionContent}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.optionTitle, { color: '#1D4ED8' }]}>Run Online</Text>
                                <View style={[styles.offlineTag, { backgroundColor: '#EFF6FF' }]}> 
                                    <Text style={[styles.offlineTagText, { color: '#1D4ED8' }]}>CLOUD</Text>
                                </View>
                            </View>
                            <Text style={styles.optionDesc}>
                                Start immediately using internet. No model download required.
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#3B82F6" />
                    </TouchableOpacity>

                    {modelChoices.map((model) => (
                        <TouchableOpacity
                            key={model.id}
                            style={[styles.optionCard, { borderColor: model.color, borderWidth: 2 }]}
                            onPress={() => handleDownloadModel(model.id, model.name, model.size)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: model.bg }]}> 
                                <Ionicons name={model.icon} size={32} color={model.color} />
                            </View>
                            <View style={styles.optionContent}>
                                <View style={styles.titleRow}>
                                    <Text style={[styles.optionTitle, { color: model.color }]}>{model.name}</Text>
                                    <View style={[styles.offlineTag, { backgroundColor: model.bg }]}>
                                        <Text style={[styles.offlineTagText, { color: model.color }]}>{model.badge}</Text>
                                    </View>
                                </View>
                                <Text style={styles.optionDesc}>
                                    {model.summary} {model.variant} • {model.size}
                                </Text>
                            </View>
                            <MaterialIcons name="download" size={24} color={model.color} />
                        </TouchableOpacity>
                    ))}

                </Animated.View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safe: {
        flex: 1,
    },
    safeCentered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...Shadows.sm,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts.bold,
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 20,
        marginBottom: 20,
        ...Shadows.md,
    },
    optionIcon: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
        paddingRight: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    optionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: '#1E293B',
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    offlineTag: {
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
        marginBottom: 4,
    },
    offlineTagText: {
        fontFamily: Fonts.bold,
        color: '#FFF',
    },
    // Download Screen Styles
    logoBg: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...Shadows.lg,
    },
    downloadTitle: {
        fontSize: 26,
        fontFamily: Fonts.bold,
        color: '#FFF',
        marginBottom: 8,
    },
    downloadSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 40,
    },
    progressCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        padding: 24,
        ...Shadows.lg,
    },
    progressTrack: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressFill: {
        height: 8,
        backgroundColor: '#4F46E5',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 16,
        color: '#475569',
        textAlign: 'center',
        fontFamily: Fonts.bold,
    },
    sizeHint: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
    },
    tipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        paddingHorizontal: 20,
    },
    tipText: {
        marginLeft: 10,
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        flex: 1,
        lineHeight: 20,
    },
});
