import { StyleSheet, ActivityIndicator, FlatList, RefreshControl, Image, TouchableOpacity, Animated, Linking } from 'react-native';

import React from 'react';
import { Text, View } from '@/components/Themed';
import { useEffect, useState, useCallback, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Alert } from 'react-native';
import api from '../services/api';
import News from '@/interfaces/News';

function extractImageSrc(html?: string): string | null {
  if (!html) return null;
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return imgMatch ? imgMatch[1] : null;
}

function stripHtml(html?: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, '');
  return text.replace(/&nbsp;/g, ' ').trim();
}

// Render body with clickable links. Returns an array of strings and <Text> elements to be used as children of a <Text>.
function renderBodyParts(html?: string) {
  if (!html) return [''];

  const parts: Array<string | React.ReactNode> = [];
  const anchorRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = anchorRe.exec(html)) !== null) {
    const index = match.index;
   const rawUrl = match[1];
    const inner = match[2];

    // push text before anchor (linkify plain text)
    if (index > lastIndex) {
      const textBefore = html.substring(lastIndex, index).replace(/<[^>]+>/g, '');
      if (textBefore) parts.push(...linkifyText(textBefore));
    }

    // push anchor as clickable Text
    const url = normalizeUrl(rawUrl);
    const textInside = inner.replace(/<[^>]+>/g, '').trim() || rawUrl;
    parts.push(
      <Text
        key={Math.random().toString(36).substr(2, 9)}
        style={styles.link}
        onPress={() => {
          Linking.openURL(url).catch((err) => console.warn('Opening link failed', err));
        }}
      >
        {textInside}
      </Text>
    );

    lastIndex = anchorRe.lastIndex;
  }

  if (lastIndex < html.length) {
    const textAfter = html.substring(lastIndex).replace(/<[^>]+>/g, '');
    if (textAfter) parts.push(...linkifyText(textAfter));
  }

  // If no anchors matched, return stripped html as a single string
  if (parts.length === 0) return linkifyText(stripHtml(html));
  return parts;
}

// Turn plain text into parts where URLs become clickable Text elements
function linkifyText(text?: string): Array<string | React.ReactNode> {
  if (!text) return [''];
  const parts: Array<string | React.ReactNode> = [];
  // Matches urls like https://..., //..., www.example.com, domain.tld/path
  const urlRe = /((?:https?:\/\/|\/\/)?(?:www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[\w\-./?%&=#~+]*)?)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(text)) !== null) {
    const idx = m.index;
    if (idx > last) {
      parts.push(text.substring(last, idx));
    }
    const raw = m[0];
    const url = normalizeUrl(raw);
    parts.push(
      <Text
        key={"link_" + idx + "_" + Math.random().toString(36).substr(2, 5)}
        style={styles.link}
        onPress={() => Linking.openURL(url).catch((err) => console.warn('Opening link failed', err))}
      >
        {raw}
      </Text>
    );
    last = idx + raw.length;
  }
  if (last < text.length) parts.push(text.substring(last));
  return parts.length ? parts : [text];
}

function normalizeUrl(href?: string): string {
  if (!href) return '';
  const trimmed = href.trim();
  // keep absolute schemes
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
  // protocol-relative URLs
  if (/^\/\//.test(trimmed)) return 'https:' + trimmed;
  // starts with www or domain without scheme, add https
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed) || /^www\./i.test(trimmed)) {
    return 'https://' + trimmed.replace(/^https?:\/\//i, '');
  }
  return trimmed;
}

export default function TabTwoScreen() {
  const [news, setNews] = useState<News[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNews();
      setNews(data);
    } catch (err: any) {
      console.error('getNews failed:', err);
      Alert.alert('Ошибка', err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.getNews();
      setNews(data);
    } catch (err: any) {
      console.error('refresh getNews failed:', err);
      Alert.alert('Ошибка', err?.message || String(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  function NewsCard({ item }: { item: News }) {
    const src = extractImageSrc(item.body);
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const toggle = () => {
      const toValue = expanded ? 0 : 1;
      Animated.timing(rotateAnim, { toValue, duration: 200, useNativeDriver: true }).start();
      setExpanded(v => !v);
    };

    return (
      <View style={styles.item}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemBody} numberOfLines={expanded ? undefined : 3}>
          {expanded ? renderBodyParts(item.body) : stripHtml(item.body)}
        </Text>
        {src ? (
          <View style={styles.imageContainer}>
            {!imgError ? (
              <>
                <Image
                  source={{ uri: src }}
                  style={styles.itemImage}
                  resizeMode="cover"
                  onLoad={() => setImgLoading(false)}
                  onError={(e) => {
                    console.warn('Image load error:', e.nativeEvent?.error || e);
                    setImgError(true);
                    setImgLoading(false);
                  }}
                />
                {imgLoading && (
                  <View style={styles.imageLoader} pointerEvents="none">
                    <ActivityIndicator />
                  </View>
                )}
              </>
            ) : ''}
          </View>
        ) : null}
        <View style={styles.wrapper}>
          <Text style={styles.itemDate}>{item.date}</Text>
          <TouchableOpacity style={styles.toggleButton} onPress={toggle} activeOpacity={0.7}>
            <Text style={styles.toggleText}>{expanded ? 'Скрыть' : 'Подробнее'}</Text>
            <Animated.View style={{ transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <FontAwesome name="chevron-down" size={12} color="#FF7700" style={{ marginLeft: 4 }} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: News }) => <NewsCard item={item} />;

  return (
    <View style={styles.container}>
      {loading && !news ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={news ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={news && news.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={<Text>Нет новостей</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: 16,
    marginTop: 16
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    backgroundColor: 'transparent',
  },
  itemTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#8B959E',
    fontWeight: '500',
    marginBottom: 0,
  },
  itemBody: {
    fontWeight: 400,
    fontSize: 15,
    lineHeight: 22,
    color: '#191C1F',
    marginTop: 16,
  },
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  itemImage: {
    width: '100%',
    height: 160,
    marginBottom: 8,
    borderRadius: 8,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    height: 'auto'
  },
  toggleText: {
    color: '#FF7700',
    fontWeight: '600',
    textTransform: 'none',
    fontSize: 14,
    marginRight: 4,
  },
  link: {
    color: '#FF7700',
    textDecorationLine: 'underline',
  },
});
