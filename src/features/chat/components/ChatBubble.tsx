import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SpeechToTextService } from '@/features/ai';
import { translateText } from '@/features/ai';
import { Colors, Spacing, BorderRadius, useAppTheme } from '@/shared';
import { WebView } from 'react-native-webview';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUri?: string;
  extractedText?: string;
  preferredLanguage?: string;
  tokensPerSec?: number;
}

interface FormulaRendererProps {
  formula: string;
  displayMode: boolean;
  isDark: boolean;
  bgColor: string;
  textColor: string;
  fallbackTextStyle: any;
}

const KATEX_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist';

function buildKaTeXHTML(formula: string, displayMode: boolean, bgColor: string, textColor: string): string {
  const escapedFormula = formula
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="${KATEX_CDN}/katex.min.css">
  <script src="${KATEX_CDN}/katex.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: ${bgColor};
      width: 100%;
      overflow-x: hidden;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: ${displayMode ? '8px 4px' : '2px 4px'};
    }
    #formula {
      color: ${textColor} !important;
    }
    .katex, .katex * {
      color: ${textColor} !important;
    }
    .katex-display {
      margin: 0 !important;
      padding: 0 !important;
    }
    .katex {
      font-size: ${displayMode ? '1.15em' : '1.0em'};
    }
  </style>
</head>
<body>
  <div id="formula"></div>
  <script>
    try {
      katex.render(\`${escapedFormula}\`, document.getElementById('formula'), {
        displayMode: ${displayMode},
        throwOnError: false,
        strict: false,
        output: 'html',
      });
      // Send the measured height back to React Native
      setTimeout(function() {
        var h = document.body.scrollHeight;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
      }, 100);
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', value: e.message }));
    }
  </script>
</body>
</html>
`;
}

function FormulaRenderer({ formula, displayMode, isDark, bgColor, textColor, fallbackTextStyle }: FormulaRendererProps) {
  const [failed, setFailed] = useState(false);
  const [height, setHeight] = useState(displayMode ? 60 : 28);
  const [loading, setLoading] = useState(true);

  const html = useMemo(
    () => buildKaTeXHTML(formula, displayMode, bgColor, textColor),
    [formula, displayMode, bgColor, textColor]
  );

  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height') {
        setHeight(Math.max(data.value, displayMode ? 40 : 24));
        setLoading(false);
      } else if (data.type === 'error') {
        setFailed(true);
        setLoading(false);
      }
    } catch {
      setFailed(true);
      setLoading(false);
    }
  }, [displayMode]);

  if (failed) {
    return <Text style={fallbackTextStyle}>{formula}</Text>;
  }

  return (
    <View style={{ width: '100%', height, position: 'relative' }}>
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
          <ActivityIndicator size="small" color={textColor} />
        </View>
      )}
      <WebView
        source={{ html }}
        style={{ width: '100%', height, backgroundColor: bgColor, opacity: loading ? 0 : 1 }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={onMessage}
        onError={() => { setFailed(true); setLoading(false); }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
      />
    </View>
  );
}

export function ChatBubble({ text, isUser, timestamp, imageUri, extractedText, preferredLanguage = 'English', tokensPerSec }: ChatBubbleProps) {
  const { isDark } = useAppTheme();
  const bubbleTheme = isDark
    ? {
      tutorBubbleBg: '#10131A',
      tutorBubbleBorder: 'rgba(255,255,255,0.08)',
      tutorText: '#E6ECFF',
      title: '#F3F7FF',
      headerText: '#F3F7FF',
      muted: '#9AA5BD',
      iconBg: '#1E2A52',
      iconText: '#2DDCFF',
      mathBg: '#161C28',
      mathBorder: 'rgba(255,255,255,0.12)',
      formulaColor: '#F8FAFC',
      footerBorder: 'rgba(255,255,255,0.08)',
      extractedBg: '#111723',
    }
    : {
      tutorBubbleBg: '#FFFFFF',
      tutorBubbleBorder: '#E2E8F0',
      tutorText: '#1E293B',
      title: '#1E40AF',
      headerText: '#0F172A',
      muted: '#64748B',
      iconBg: '#EEF2FF',
      iconText: '#4F46E5',
      mathBg: '#F8FAFC',
      mathBorder: '#CBD5E1',
      formulaColor: '#0F172A',
      footerBorder: 'rgba(0,0,0,0.06)',
      extractedBg: '#F8FAFC',
    };

  const styles = useMemo(() => createStyles(bubbleTheme), [bubbleTheme]);
  // KaTeX colors derived from theme – used by FormulaRenderer
  const katexBgColor = bubbleTheme.mathBg;
  const katexTextColor = bubbleTheme.formulaColor;

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
    const stripCodeFences = (value: string) =>
      value
        .replace(/^```(?:latex|tex|math)?\s*/i, '')
        .replace(/```$/g, '')
        .trim();

    const normalizeFormula = (formula: string) =>
      stripCodeFences(formula)
        .replace(/\\n/g, ' ')
        .replace(/[−–—]/g, '-')
        .replace(/×/g, '\\times ')
        .replace(/÷/g, '\\div ')
        .replace(/√/g, '\\sqrt')
        .replace(/π/g, '\\pi ')
        .replace(/\s+/g, ' ')
        .trim();

    const isSimpleMathText = (formula: string) =>
      /^[A-Za-z0-9+\-*/=().,:_\s]+$/.test(formula);

    const hasLikelyMathContent = (formula: string) => /[A-Za-z0-9\\^_=+\-*/]/.test(formula);

    const hasBalancedDelimiters = (formula: string) => {
      const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
      const stack: string[] = [];
      for (const ch of formula) {
        if (pairs[ch]) stack.push(ch);
        else if (Object.values(pairs).includes(ch)) {
          const open = stack.pop();
          if (!open || pairs[open] !== ch) return false;
        }
      }
      return stack.length === 0;
    };

    const isLikelyMalformedLatex = (formula: string) => {
      if (!formula) return true;
      if (formula.length > 600) return true;
      if (!hasLikelyMathContent(formula)) return true;
      if (!hasBalancedDelimiters(formula)) return true;
      // OCR/LLM sometimes wraps sentence text inside math delimiters.
      if (/\b(final answer|solution|therefore|equation|are:)\b/i.test(formula)) return true;
      return false;
    };

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

    // Regex to find math wrapped in $$...$$, \[...\], \(...\), or single-line $...$.
    // Single-dollar math is intentionally restricted to one line to avoid swallowing plain text.
    const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^\n$][^$]*?\$)/g;
    const parts = mainText.split(mathRegex);

    return (
      <>
        {title && <Text style={styles.bubbleTitle}>{title}</Text>}
        <View style={styles.textWrapper}>
          {parts.map((part, index) => {
            if (!part) return null;

            // Handle display mode: $$ or \[
            if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\[') && part.endsWith('\\]'))) {
              const formula = part.startsWith('$$')
                ? part.substring(2, part.length - 2)
                : part.substring(2, part.length - 2);
              const cleanFormula = normalizeFormula(formula);
              if (!cleanFormula) {
                return null;
              }

              if (isSimpleMathText(cleanFormula) || isLikelyMalformedLatex(cleanFormula)) {
                return (
                  <Text key={index} style={styles.mathPlainText}>{cleanFormula}</Text>
                );
              }

              return (
                <View key={index} style={styles.mathBlock}>
                  <FormulaRenderer
                    formula={cleanFormula}
                    displayMode={true}
                    isDark={isDark}
                    bgColor={katexBgColor}
                    textColor={katexTextColor}
                    fallbackTextStyle={styles.mathFallbackText}
                  />
                </View>
              );
            }
            // Handle inline mode: $ or \(
            else if ((part.startsWith('$') && part.endsWith('$')) || (part.startsWith('\\(') && part.endsWith('\\)') && !part.includes('\n'))) {
              const formula = part.startsWith('$')
                ? part.substring(1, part.length - 1)
                : part.substring(2, part.length - 2);
              const cleanFormula = normalizeFormula(formula);
              if (!cleanFormula) {
                return null;
              }

              if (isSimpleMathText(cleanFormula) || isLikelyMalformedLatex(cleanFormula)) {
                return (
                  <Text key={index} style={styles.inlineMathPlainText}>{cleanFormula}</Text>
                );
              }

              return (
                <View key={index} style={styles.inlineMathWrapper}>
                  <FormulaRenderer
                    formula={cleanFormula}
                    displayMode={false}
                    isDark={isDark}
                    bgColor={katexBgColor}
                    textColor={katexTextColor}
                    fallbackTextStyle={styles.inlineMathText}
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
                <Ionicons name={isSpeaking ? "volume-high" : "volume-medium-outline"} size={16} color={bubbleTheme.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopy}>
                <Ionicons name="copy-outline" size={16} color={bubbleTheme.muted} />
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

const createStyles = (theme: {
  tutorBubbleBg: string;
  tutorBubbleBorder: string;
  tutorText: string;
  title: string;
  headerText: string;
  muted: string;
  iconBg: string;
  iconText: string;
  mathBg: string;
  mathBorder: string;
  formulaColor: string;
  footerBorder: string;
  extractedBg: string;
}) => StyleSheet.create({
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
    backgroundColor: theme.tutorBubbleBg,
    borderRadius: 22,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.tutorBubbleBorder,
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
    backgroundColor: theme.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorNameLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.iconText,
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
    color: theme.title,
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
    color: theme.tutorText,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    color: theme.headerText,
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
    backgroundColor: theme.mathBg,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.mathBorder,
    // Soft shadow for math block
    shadowColor: Colors.gray400,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inlineMathWrapper: {
    marginHorizontal: 1,
    paddingHorizontal: 4,
    backgroundColor: theme.mathBg,
    borderRadius: 4,
    minHeight: 32,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: theme.mathBorder,
    overflow: 'hidden',
  },
  mathFallbackText: {
    color: theme.formulaColor,
    fontSize: 18,
    fontWeight: '600',
  },
  mathPlainText: {
    color: theme.formulaColor,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    marginVertical: 4,
  },
  inlineMathPlainText: {
    color: theme.formulaColor,
    fontSize: 16,
    fontWeight: '600',
  },
  inlineMathText: {
    color: theme.formulaColor,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: theme.footerBorder,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '600',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  tutorTimestamp: {
    color: theme.muted,
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
    backgroundColor: theme.extractedBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: theme.mathBorder,
  },
  extractedTextIcon: {
    fontSize: 10,
    marginRight: 6,
  },
  extractedTextTag: {
    fontSize: 10,
    color: theme.muted,
    fontWeight: '500',
  },
});
