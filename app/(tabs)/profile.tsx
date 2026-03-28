import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { getProfile } from '@/features/user';
import { useAppTheme } from '@/shared';
import { DARK_THEME, LIGHT_THEME, AppTheme, Spacing } from '@/shared';

const ACHIEVEMENT_COLORS = ['#818CF8','#34D399','#F59E0B'];

export default function ProfileScreen() {
  const router = useRouter();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme: AppTheme = isDark ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme, isDark), [theme]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await getProfile();
        if (d) setProfile(d);
      } catch {}
    })();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const name    = profile?.name || 'Student';
  const grade   = profile?.grade || 'Class 9';
  const initial = name.charAt(0).toUpperCase();

  const STATS = [
    { label: 'Chapters',  value: '12', icon: 'book-open-variant',   color: '#818CF8' },
    { label: 'Quizzes',   value: '45', icon: 'help-circle-outline',  color: '#34D399' },
    { label: 'Day Streak',value: '7',  icon: 'fire',                 color: '#F59E0B' },
  ];

  const MENU_SECTIONS = [
    {
      title: 'Learning',
      items: [
        { icon:'time-outline',         label:'Chat History',    route:'/history' },
        { icon:'document-text-outline',label:'My Study Notes',  route:'/notes' },
        { icon:'analytics-outline',    label:'Progress Stats',  route:'/progress' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon:'settings-outline',       label:'App Settings',       route:'/settings' },
        { icon:'person-outline',         label:'Edit Profile',        route:null },
        { icon:'shield-checkmark-outline',label:'Privacy & Security', route:null },
        { icon:'log-out-outline',        label:'Log Out',             route:null, destructive: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Top bar ────────────────────────────────────────────────────── */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.hKicker}>MY ACCOUNT</Text>
              <Text style={styles.hTitle}>Profile</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* ── Avatar hero card ───────────────────────────────────────────── */}
          <LinearGradient
            colors={isDark ? ['#1C2040','#131729'] : ['#6366F1','#818CF8']}
            start={{ x:0, y:0 }} end={{ x:1, y:1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroBlobTL} />
            <View style={styles.heroBlobBR} />

            <View style={styles.heroContent}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.avatarBadge}>
                  <Ionicons name="school" size={12} color="#FFFFFF" />
                </View>
              </View>
              <View style={{ flex:1 }}>
                <Text style={styles.heroName}>{name}</Text>
                <Text style={styles.heroGrade}>{grade}</Text>
                <View style={styles.xpBadge}>
                  <Ionicons name="sparkles" size={13} color="#F59E0B" />
                  <Text style={styles.xpText}>2,450 XP earned</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* ── Achievement stats ──────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <LinearGradient key={s.label} colors={theme.cardGradient as any} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor:`${s.color}22` }]}>
                  <MaterialCommunityIcons name={s.icon as any} size={18} color={s.color} />
                </View>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </LinearGradient>
            ))}
          </View>

          {/* ── Preferences ────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <View style={[styles.prefIcon, { backgroundColor: isDark?'#17223F':'#EEF2FF' }]}>
                  <Ionicons name="notifications-outline" size={16} color={theme.accent} />
                </View>
                <Text style={styles.prefLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.panelSoft, true: `${theme.accent}88` }}
                thumbColor={notifications ? theme.accent : theme.textMuted}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <View style={[styles.prefIcon, { backgroundColor: isDark?'#0E2918':'#D1FAE5' }]}>
                  <Ionicons name="alarm-outline" size={16} color="#10B981" />
                </View>
                <Text style={styles.prefLabel}>Study Reminders</Text>
              </View>
              <Switch
                value={reminders}
                onValueChange={setReminders}
                trackColor={{ false: theme.panelSoft, true: '#10B98188' }}
                thumbColor={reminders ? '#10B981' : theme.textMuted}
              />
            </View>
          </View>

          {/* ── Menu sections ──────────────────────────────────────────────── */}
          {MENU_SECTIONS.map(section => (
            <View key={section.title}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.card}>
                {section.items.map((item, i) => (
                  <View key={item.label}>
                    <TouchableOpacity
                      style={styles.menuRow}
                      onPress={() => {
                        if (item.destructive) {
                          Alert.alert('Log Out', 'Are you sure?', [
                            { text: 'Cancel', style:'cancel' },
                            { text: 'Log Out', style:'destructive', onPress: () => router.replace('/') },
                          ]);
                        } else if (item.route) {
                          router.push(item.route as any);
                        } else {
                          Alert.alert('Coming Soon', 'This feature is on the way!');
                        }
                      }}
                    >
                      <View style={styles.menuLeft}>
                        <View style={[styles.menuIcon, { backgroundColor: item.destructive ? '#FEE2E2' : theme.panelSoft }]}>
                          <Ionicons
                            name={item.icon as any}
                            size={16}
                            color={item.destructive ? '#EF4444' : theme.textMuted}
                          />
                        </View>
                        <Text style={[styles.menuLabel, item.destructive && { color:'#EF4444' }]}>
                          {item.label}
                        </Text>
                      </View>
                      <View style={[styles.menuChevron, { backgroundColor: theme.panelSoft }]}>
                        <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                      </View>
                    </TouchableOpacity>
                    {i < section.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTxt}>Shiksha AI · v1.0.0</Text>
            <Text style={styles.footerTxt}>Made with ❤️ for students</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, isDark: boolean) {
  return StyleSheet.create({
    root:   { flex:1, backgroundColor:theme.surface },
    scroll: { paddingBottom:30 },

    topBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.lg, paddingTop:10, paddingBottom:14 },
    hKicker: { color:theme.textMuted, fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:2 },
    hTitle:  { color:theme.text, fontSize:26, fontWeight:'800' },
    iconBtn: { width:36, height:36, borderRadius:12, backgroundColor:theme.panel, borderWidth:1, borderColor:theme.border, justifyContent:'center', alignItems:'center' },

    heroCard: { marginHorizontal:Spacing.lg, borderRadius:24, padding:20, overflow:'hidden', marginBottom:16 },
    heroBlobTL: { position:'absolute', top:-24, left:-24, width:100, height:100, borderRadius:50, backgroundColor:'rgba(255,255,255,0.07)' },
    heroBlobBR: { position:'absolute', bottom:-20, right:-16, width:80, height:80, borderRadius:40, backgroundColor:'rgba(255,255,255,0.05)' },
    heroContent: { flexDirection:'row', alignItems:'center', gap:14 },
    avatarRing: { position:'relative' },
    avatar: { width:68, height:68, borderRadius:34, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'rgba(255,255,255,0.5)' },
    avatarText: { color:'#FFFFFF', fontSize:28, fontWeight:'800' },
    avatarBadge: { position:'absolute', bottom:0, right:0, width:20, height:20, borderRadius:10, backgroundColor:'#F59E0B', justifyContent:'center', alignItems:'center', borderWidth:1.5, borderColor:'#FFFFFF' },
    heroName:  { color:'#FFFFFF', fontSize:20, fontWeight:'800', marginBottom:3 },
    heroGrade: { color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:'600', marginBottom:8 },
    xpBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.15)', paddingHorizontal:10, paddingVertical:4, borderRadius:999, alignSelf:'flex-start' },
    xpText:  { color:'#FFFFFF', fontSize:12, fontWeight:'700' },

    statsRow: { flexDirection:'row', paddingHorizontal:Spacing.lg, gap:10, marginBottom:20 },
    statCard: { flex:1, borderRadius:16, padding:12, borderWidth:1, borderColor:theme.border, alignItems:'center', gap:6 },
    statIcon: { width:36, height:36, borderRadius:10, justifyContent:'center', alignItems:'center' },
    statVal:  { fontSize:18, fontWeight:'800' },
    statLbl:  { color:theme.textMuted, fontSize:11, fontWeight:'600' },

    sectionTitle: { color:theme.text, fontSize:14, fontWeight:'800', marginHorizontal:Spacing.lg, marginBottom:8, marginTop:4, letterSpacing:0.3 },

    card: { backgroundColor:theme.panel, borderRadius:18, borderWidth:1, borderColor:theme.border, paddingHorizontal:14, marginHorizontal:Spacing.lg, marginBottom:16 },

    prefRow:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', minHeight:52 },
    prefLeft: { flexDirection:'row', alignItems:'center', gap:10 },
    prefIcon: { width:32, height:32, borderRadius:9, justifyContent:'center', alignItems:'center' },
    prefLabel: { color:theme.text, fontSize:14, fontWeight:'600' },
    divider:  { height:1, backgroundColor:theme.border },

    menuRow:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', minHeight:52 },
    menuLeft:   { flexDirection:'row', alignItems:'center', gap:10 },
    menuIcon:   { width:32, height:32, borderRadius:9, justifyContent:'center', alignItems:'center' },
    menuLabel:  { color:theme.text, fontSize:14, fontWeight:'600' },
    menuChevron:{ width:24, height:24, borderRadius:7, justifyContent:'center', alignItems:'center' },

    footer:    { alignItems:'center', paddingTop:16, gap:3 },
    footerTxt: { color:theme.textMuted, fontSize:12, fontWeight:'600' },
  });
}
