import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SpeechToTextService } from '@/services/speechToText';
import { translateText } from '@/services/api';
import { Colors, Spacing, BorderRadius } from '@/styles/designSystem';
import KaTeX from 'react-native-katex';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUri?: string;
  extractedText?: string;
  preferredLanguage?: string;
}

export function ChatBubble({ text, isUser, timestamp, imageUri, extractedText, preferredLanguage = 'English' }: ChatBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const formatTime = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSpeak = async () => {
    if (isUser) return;

    if (isSpeaking) {
      await SpeechToTextService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      try {
        await SpeechToTextService.speak(text, 'en-IN', () => {
          setIsSpeaking(false);
        });
      } catch (error) {
        setIsSpeaking(false);
        console.error('Error speaking:', error);
      }
    }
  };

  const handleCopy = () => {
    Share.share({ message: translatedText || text });
  };

  const handleTranslate = async () => {
    if (isUser || preferredLanguage === 'English') return;
    
    if (translatedText) {
      setTranslatedText(null); // Toggle back to original
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateText(text, preferredLanguage);
      setTranslatedText(result);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const renderTextContent = (content: string) => {
    // Basic detection of math blocks (wrapped in $ or $$)
    const mathRegex = /(\$\$?[\s\S]+?\$?\$)/g;
    const parts = content.split(mathRegex);

    return parts.map((part, index) => {
      if (part.startsWith('$')) {
        const formula = part.replace(/\$/g, '');
        return (
          <View key={index} style={styles.mathBlock}>
            <KaTeX
              expression={formula}
              style={styles.katex}
            />
          </View>
        );
      }
      return (
        <Text key={index} style={[styles.text, isUser ? styles.userText : styles.tutorText]}>
          {part}
        </Text>
      );
    });
  };

  const renderBubbleContent = () => (
    <View>
      {imageUri && (
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.messageImage} />
          <View style={styles.imageOverlay}>
            <Ionicons name="expand" size={20} color={Colors.white} />
          </View>
        </View>
      )}
      <View style={styles.textWrapper}>
        {renderTextContent(translatedText || text)}
        {translatedText && (
          <Text style={styles.translationLine}>
            Translated to {preferredLanguage}
          </Text>
        )}
      </View>
      {extractedText && (
        <View style={styles.extractedTextIndicator}>
           <Text style={styles.extractedTextIcon}>📄</Text>
           <Text style={styles.extractedTextTag}>Text extracted from image</Text>
         </View>
      )}
      <View style={styles.footer}>
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.tutorTimestamp]}>
          {formatTime(timestamp)}
        </Text>
        {!isUser && (
          <View style={styles.tutorActions}>
            {preferredLanguage !== 'English' && (
              <TouchableOpacity onPress={handleTranslate} disabled={isTranslating}>
                <Ionicons 
                  name={translatedText ? "language" : "language-outline"} 
                  size={16} 
                  color={isTranslating ? Colors.gray400 : Colors.secondary} 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSpeak}>
              <Ionicons name={isSpeaking ? "volume-high" : "volume-medium-outline"} size={16} color={Colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopy}>
              <Ionicons name="copy-outline" size={16} color={Colors.gray500} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.tutorContainer]}>
      {!isUser && (
        <View style={styles.avatarMini}>
          <FontAwesome5 name="robot" size={10} color={Colors.white} />
        </View>
      )}
      {isUser ? (
        <LinearGradient
          colors={Colors.secondaryGradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userBubble}
        >
          {renderBubbleContent()}
        </LinearGradient>
      ) : (
        <View style={styles.tutorBubble}>
          {renderBubbleContent()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  tutorContainer: {
    alignSelf: 'flex-start',
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  userBubble: {
    padding: Spacing.md,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    ...Colors.cardShadow as any,
  },
  tutorBubble: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    ...Colors.cardShadow as any,
  },
  imageWrap: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  messageImage: {
    width: 200,
    height: 150,
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  userText: {
    color: Colors.white,
  },
  tutorText: {
    color: Colors.gray900,
  },
  textWrapper: {
    flexDirection: 'column',
    gap: 4,
  },
  translationLine: {
    fontSize: 10,
    fontStyle: 'italic',
    color: Colors.secondary,
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 4,
  },
  mathBlock: {
    marginVertical: 8,
    minHeight: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    padding: 4,
  },
  katex: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    minWidth: 40,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '600',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  tutorTimestamp: {
    color: Colors.gray500,
  },
  tutorActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 15,
  },
  extractedTextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  extractedTextIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  extractedTextTag: {
    fontSize: 10,
    color: Colors.gray600,
  },
});
