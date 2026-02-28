# 🔊 Text-to-Speech (TTS) Implementation

## Overview

Shiksha AI now includes **multilingual text-to-speech** capabilities, allowing users to listen to AI tutor responses in their preferred language.

**Supported Languages:**
- ✅ English (en-IN, en-US)
- ✅ Hindi (hi-IN)
- ✅ Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, Bengali, Odia, Assamese, Urdu

---

## Architecture

### Frontend (React Native)

**File:** `src/services/speechToText.ts`

```typescript
// Main speak method
SpeechToTextService.speak(text, 'hi-IN', onDone?)

// Convenience methods
SpeechToTextService.speakHindi(text)
SpeechToTextService.speakEnglish(text)
SpeechToTextService.stopSpeaking()
```

**Configuration:**
- **Pitch:** 1.0 (normal)
- **Rate:** 0.9 (slightly slower for clarity)
- **Library:** `expo-speech` (built-in, no extra installation needed)

### ChatBubble Integration

**File:** `src/components/ChatBubble.tsx`

The speaker button (🔊) respects the user's preferred language:

```tsx
// Automatically maps user preference to language code
if (preferredLanguage === 'Hindi') languageCode = 'hi-IN'
if (preferredLanguage === 'Marathi') languageCode = 'mr-IN'
// ... etc
```

### Settings Integration

**File:** `app/(tabs)/settings.tsx`

Users can change their preferred language, which affects:
- Response language (if using NLLB-200 translation)
- TTS output language
- UI language

---

## Usage

### In the App

1. **Tap the speaker icon** (🔊) on any tutor response
2. **Audio plays** in the user's selected language
3. **Tap again** to stop playback
4. **Change language** in Settings → Preferred Language

### In Code

```typescript
import { SpeechToTextService } from '@/services/speechToText';

// Speak in English (default)
await SpeechToTextService.speak("Hello, this is a test", 'en-IN');

// Speak in Hindi
await SpeechToTextService.speakHindi("नमस्ते, यह एक परीक्षण है");

// Speak and execute callback when done
await SpeechToTextService.speak(text, 'hi-IN', () => {
  console.log('Speech finished');
});

// Stop current speech
await SpeechToTextService.stopSpeaking();
```

---

## Language Codes

| Language | Code | Script |
|----------|------|--------|
| English (India) | `en-IN` | Latin |
| English (US) | `en-US` | Latin |
| Hindi | `hi-IN` | Devanagari |
| Marathi | `mr-IN` | Devanagari |
| Tamil | `ta-IN` | Tamil |
| Telugu | `te-IN` | Telugu |
| Kannada | `kn-IN` | Kannada |
| Malayalam | `ml-IN` | Malayalam |
| Gujarati | `gu-IN` | Gujarati |
| Punjabi | `pa-IN` | Gurmukhi |
| Bengali | `bn-IN` | Bengali |
| Odia | `or-IN` | Odia |
| Assamese | `as-IN` | Assamese |
| Urdu | `ur-IN` | Nastaliq |

---

## Technical Details

### Engine
- **Mobile:** Native OS speech synthesis (iOS AVSpeechSynthesizer, Android TextToSpeech)
- **Web:** Web Speech API (platform-dependent, may have limited language support)

### Performance
- **Non-blocking:** Speech synthesis happens in background
- **Callback support:** Optional `onDone` callback when speech completes
- **Cancellable:** Call `stopSpeaking()` anytime
- **Memory:** Minimal memory footprint (uses OS-level synthesis)

### API Flow

```
User taps 🔊 on ChatBubble
    ↓
ChatBubble.handleSpeak()
    ↓
Get preferredLanguage from settings
    ↓
Map language name → language code
    ↓
Call SpeechToTextService.speak(text, languageCode)
    ↓
Expo.Speech.speak() → OS speech engine
    ↓
Audio output + optional callback
```

---

## Testing

Run the test script to verify TTS configuration:

```bash
# Test with English
node test-tts.js english "Hello, this is a test"

# Test with Hindi
node test-tts.js hindi "नमस्ते, यह एक परीक्षण है"

# Test with custom text
node test-tts.js english "Your custom text here"
```

**Output Example:**
```
🔊 Text-to-Speech Service Tester
================================

📢 Language: English (en-IN)
⏱️  Rate: 0.9 (slightly slower for clarity)

✅ TTS Configuration Summary:
   - Language Code: en-IN
   - Language Name: English
   - Pitch: 1.0 (normal)
   - Rate: 0.9 (slower for clarity)
   - Support: Multilingual (Hindi, English, and 11 other Indian languages)
```

---

## Future Enhancements

- [ ] Voice selection (male/female voices per language)
- [ ] Speech rate customization in Settings
- [ ] Speech synthesis caching (store common responses)
- [ ] Offline TTS (download language packs)
- [ ] Auto-speak on response (optional)
- [ ] Accent selection per language

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No audio output | Check device volume & media output setting |
| Wrong language | Verify `preferredLanguage` in Settings |
| Slow response | Expected (rate set to 0.9 for clarity) |
| Speech not stopping | Call `SpeechToTextService.stopSpeaking()` |
| Language not supported | Device OS may not support it (try en-IN fallback) |

---

## Code References

- **Service:** [src/services/speechToText.ts](../src/services/speechToText.ts#L185)
- **Component:** [src/components/ChatBubble.tsx](../src/components/ChatBubble.tsx#L37)
- **Test Script:** [test-tts.js](../test-tts.js)
- **Dependencies:** `expo-speech` (already installed with Expo SDK 54)

---

## Example Integration

```tsx
// In a new component
import { SpeechToTextService } from '@/services/speechToText';
import { getPreferredLanguage } from '@/storage/settingsStore';

export function SpeakableText({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [language, setLanguage] = useState('en-IN');

  useEffect(() => {
    getPreferredLanguage().then(setLanguage);
  }, []);

  const handleSpeak = async () => {
    setSpeaking(true);
    await SpeechToTextService.speak(text, language, () => {
      setSpeaking(false);
    });
  };

  return (
    <TouchableOpacity onPress={handleSpeak}>
      <Text>{speaking ? 'Speaking...' : 'Play Audio'}</Text>
    </TouchableOpacity>
  );
}
```

---

## License

MIT - Part of Shiksha AI
