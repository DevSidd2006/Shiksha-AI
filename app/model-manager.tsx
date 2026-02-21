import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Fonts, Shadows } from '@/styles/designSystem';
import { getModels, downloadModel, deleteModelFile, Model, hasDownloadedModel, getActiveModel, setActiveModel } from '@/services/modelDownloadService';
import { llamaBridge } from '@/services/nativeLlama';
import { setOfflineModelPath } from '@/services/offlineTutor';
import { useRouter } from 'expo-router';
import { initializeDatabase } from '@/database/init';

export default function ModelManagerScreen() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await initializeDatabase();
        const ready = await hasDownloadedModel();
        setIsFirstTime(!ready);
        await loadModels();
      } catch (error) {
        console.error('Model setup initialization failed:', error);
        Alert.alert('Error', 'Failed to load models. Please restart the app.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadModels = async () => {
    const [data, active] = await Promise.all([getModels(), getActiveModel()]);
    setModels(data);
    setActiveModelId(active?.id || null);
  };

  const handleDownload = async (model: Model) => {
    if (downloadingId) return;
    setDownloadingId(model.id);
    setProgress(0);

    try {
      const path = await downloadModel(model.id, (p: number) => setProgress(p));
      setOfflineModelPath(path);
      await llamaBridge.ensure(path);
      await loadModels();
      Alert.alert(
        'Success', 
        `${model.name} is ready for learning!`,
        [
          { 
            text: 'Start Learning', 
            onPress: () => router.replace('/(tabs)/dashboard') 
          }
        ]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download model');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (model: Model) => {
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete ${model.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await deleteModelFile(model.id);
            loadModels();
          } 
        }
      ]
    );
  };

  const handleApply = async (model: Model) => {
    if (model.status !== 'downloaded' || !model.localPath) {
      Alert.alert('Error', 'Please download the model first.');
      return;
    }

    await setActiveModel(model.id);
    setOfflineModelPath(model.localPath);
    const success = await llamaBridge.ensure(model.localPath);
    setActiveModelId(model.id);

    if (success) {
      Alert.alert('Applied', `Using local model: ${model.name}`);
    } else {
      Alert.alert('Applied', `Model selected: ${model.name}. Native runtime will initialize on supported standalone builds.`);
    }
  };

  const renderItem = ({ item }: { item: Model }) => (
    <View style={styles.modelCard}>
      <View style={styles.modelRow}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="memory" size={32} color={Colors.primary} />
        </View>
        <View style={styles.modelInfo}>
          <Text style={styles.modelName}>{item.name}</Text>
          <Text style={styles.modelSize}>{item.size}</Text>
          {item.status === 'downloaded' && activeModelId === item.id && (
            <Text style={styles.activeTag}>Active on device</Text>
          )}
        </View>

        {item.status === 'downloaded' ? (
          <View style={styles.actionColumn}>
             <TouchableOpacity onPress={() => handleApply(item)} style={styles.applyButton}>
               <Text style={styles.applyText}>Use</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
               <Ionicons name="trash-outline" size={20} color={Colors.error} />
             </TouchableOpacity>
          </View>
        ) : item.status === 'downloading' ? (
          <View style={styles.downloadProgress}>
             <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleDownload(item)} style={styles.downloadButton}>
             <Ionicons name="cloud-download-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
      
      {downloadingId === item.id && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(progress * 100, 100))}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{(progress * 100).toFixed(1)}%</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <View style={styles.headerTop}>
          {!isFirstTime && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>{isFirstTime ? 'Setup Your Brain' : 'Study Models'}</Text>
            <Text style={styles.headerSubtitle}>
              {isFirstTime 
                ? 'Download a model to start learning offline' 
                : 'Manage your on-device AI models'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {isFirstTime && (
        <View style={styles.welcomeInfo}>
          <MaterialIcons name="offline-bolt" size={24} color={Colors.primary} />
          <Text style={styles.welcomeText}>
            Shiksha AI runs completely on your phone. Download Qwen (1.5B) for the best balance of speed and intelligence.
          </Text>
        </View>
      )}

      <FlatList
        data={models}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No models found</Text>
              <Text style={styles.emptySubtitle}>Please restart the app once and try again.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  welcomeInfo: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  welcomeText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modelCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    padding: Spacing.sm,
    backgroundColor: '#EEF2FF',
    borderRadius: BorderRadius.md,
  },
  modelInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modelSize: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeTag: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.success,
    fontFamily: Fonts.bold,
  },
  actionColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  applyText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadProgress: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    marginTop: Spacing.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
  },
  progressLabel: {
    textAlign: 'right',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
  },
  emptySubtitle: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
