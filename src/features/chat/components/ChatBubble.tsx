import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SpeechToTextService } from '@/features/ai';
import { translateText } from '@/features/ai';
import { Colors, Spacing, BorderRadius } from '@/shared';
import KaTeX from 'react-native-katex';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUri?: string;
  extractedText?: string;
  preferredLanguage?: string;
  tokensPerSec?: number;
}

export function ChatBubble({ text, isUser, timestamp, imageUri, extractedText, preferredLanguage = 'English', tokensPerSec }: ChatBubbleProps) {
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
        // Map preferred language to language code
        let languageCode = 'en-IN'; // default English (India)
        if (preferredLanguage === 'Hindi' || preferredLanguage === 'hi-IN') {
          languageCode = 'hi-IN';
        } else if (preferredLanguage === 'Marathi') {
          languageCode = 'mr-IN';
        } else if (preferredLanguage === 'Tamil') {
          languageCode = 'ta-IN';
        } else if (preferredLanguage === 'Telugu') {
          languageCode = 'te-IN';
        }

        await SpeechToTextService.speak(text, languageCode, () => {
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
    // Determine if it's AI and if it has a title (like "Solving the Equation...")
    let title: string | null = null;
    let mainText = content;

    if (!isUser) {
      const titleMatch = content.match(/^([^\n]+)\n/);
      if (titleMatch && titleMatch[1].length < 120 && (
        titleMatch[1].includes(':') ||
        titleMatch[1].toLowerCase().includes('solving') ||
        titleMatch[1].toLowerCase().includes('step') ||
        titleMatch[1].toLowerCase().includes('break down')
      )) {
        title = titleMatch[1];
        mainText = content.substring(title.length).trim();
      }
    }

    // Regex to find math blocks wrapped in $$, $, \[, or \(
    // Added support for \[ ... \] and \( ... \) as common AI LaTeX markers
    const mathRegex = /(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/gs;
    const parts = mainText.split(mathRegex);

    return (
      <>
        {title && <Text style={styles.bubbleTitle}>{title}</Text>}
        <View style={styles.textWrapper}>
          {parts.map((part, index) => {
            if (!part) return null;

            // Handle display mode: $$ or \[
            if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\\[') && part.endsWith('\\\]'))) {
              const formula = part.startsWith('$$')
                ? part.substring(2, part.length - 2)
                : part.substring(2, part.length - 2);
              return (
                <View key={index} style={styles.mathBlock}>
                  <KaTeX
                    expression={`\\color{black}{${formula.trim()}}`}
                    style={styles.katex}
                    displayMode={true}
                  />
                </View>
              );
            }
            // Handle inline mode: $ or \(
            else if ((part.startsWith('$') && part.endsWith('$')) || (part.startsWith('\\\(') && part.endsWith('\\\)') && !part.includes('\n'))) {
              const formula = part.startsWith('$')
                ? part.substring(1, part.length - 1)
                : part.substring(2, part.length - 2);
              return (
                <View key={index} style={styles.inlineMathWrapper}>
                  <Text style={{ position: 'absolute', opacity: 0 }}>{formula.trim()}</Text>
                  <KaTeX
                    expression={`\\color{black}{${formula.trim()}}`}
                    style={styles.katexInline}
                    displayMode={false}
                  />
                </View>
              );
            }

            // Process regular text with simple markdown support
            const renderFormattedText = (raw: string) => {
              const trimmed = raw.trim();

              // Handle Headers (###)
              if (trimmed.startsWith('### ')) {
                return (
                  <Text key={index} style={[styles.text, styles.headerText, isUser ? styles.userText : styles.tutorText]}>
                    {trimmed.substring(4)}
                  </Text>
                );
              }

              // Split by bold markers
              const boldRegex = /(\*\*.*?\*\*)/g;
              const subParts = raw.split(boldRegex);

              return (
                <Text key={index} style={[styles.text, isUser ? styles.userText : styles.tutorText]}>
                  {subParts.map((sub, i) => {
                    if (sub.startsWith('**') && sub.endsWith('**')) {
                      return (
                        <Text key={i} style={{ fontWeight: '700' }}>
                          {sub.substring(2, sub.length - 2)}
                        </Text>
                      );
                    }
                    return <Text key={i}>{sub}</Text>;
                  })}
                </Text>
              );
            };

            return renderFormattedText(part);
          })}
        </View>
      </>
    );
  };

  const renderBubbleContent = () => (
    <View style={styles.bubbleContent}>
      {!isUser && (
        <View style={styles.tutorHeader}>
          <View style={styles.tutorIconBg}>
            <Ionicons name="school" size={14} color={Colors.primary} />
          </View>
          <Text style={styles.tutorNameLabel}>Shiksha AI</Text>
        </View>
      )}
      {imageUri && (
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.messageImage} />
        </View>
      )}
      <View style={styles.contentAndFooter}>
        {renderTextContent(translatedText || text)}

        {translatedText && (
          <Text style={styles.translationLine}>
            Translated to {preferredLanguage}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.timestampContainer}>
            <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.tutorTimestamp]}>
              {formatTime(timestamp)}
            </Text>
            {!isUser && tokensPerSec && (
              <Text style={styles.performanceMetric}>
                • {tokensPerSec.toFixed(1)} t/s
              </Text>
            )}
          </View>
          {!isUser && (
            <View style={styles.tutorActions}>
              <TouchableOpacity onPress={handleSpeak}>
                <Ionicons name={isSpeaking ? "volume-high" : "volume-medium-outline"} size={16} color={Colors.gray400} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopy}>
                <Ionicons name="copy-outline" size={16} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.tutorContainer]}>
      <View style={[isUser ? styles.userBubble : styles.tutorBubble]}>
        {renderBubbleContent()}
      </View>
      {extractedText && (
        <View style={styles.extractedTextIndicator}>
          <Text style={styles.extractedTextIcon}>📄</Text>
          <Text style={styles.extractedTextTag}>Text extracted from image</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    maxWidth: '88%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    width: 'auto',
  },
  tutorContainer: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  userBubble: {
    padding: 14,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    borderBottomRightRadius: 4,
  },
  tutorBubble: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 22,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.gray100,
    // Subtle shadow for elegance
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  bubbleContent: {
    width: '100%',
  },
  tutorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    opacity: 0.9,
  },
  tutorIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorNameLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imageWrap: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
  },
  messageImage: {
    width: '100%',
    aspectRatio: 1.2,
    resizeMode: 'cover',
  },
  contentAndFooter: {
    flexDirection: 'column',
  },
  bubbleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  userText: {
    color: Colors.white,
  },
  tutorText: {
    color: Colors.gray800,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    color: Colors.gray900,
  },
  textWrapper: {
    flexDirection: 'column',
    gap: 4,
  },
  translationLine: {
    fontSize: 11,
    fontStyle: 'italic',
    color: Colors.secondary,
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.gray100,
  },
  mathBlock: {
    marginVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
    // Soft shadow for math block
    shadowColor: Colors.gray400,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inlineMathWrapper: {
    marginHorizontal: 1,
    paddingHorizontal: 4,
    backgroundColor: Colors.white,
    borderRadius: 4,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.gray200,
  },
  katex: {
    width: '100%',
    height: 70, // Increased height for complex formulas
    backgroundColor: Colors.white,
  },
  katexInline: {
    width: 80,
    height: 30,
    backgroundColor: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '600',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  tutorTimestamp: {
    color: Colors.gray400,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performanceMetric: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  tutorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  extractedTextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    backgroundColor: Colors.gray50,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.gray200,
  },
  extractedTextIcon: {
    fontSize: 10,
    marginRight: 6,
  },
  extractedTextTag: {
    fontSize: 10,
    color: Colors.gray500,
    fontWeight: '500',
  },
});
