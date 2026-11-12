import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Icon } from '../icons';
import { Tap, PetAvatar, PartnerMark } from '../ui';
import { useTheme } from '../theme';
import { PETS, PARTNERS, POSTS, fmt } from '../data';

// Estado das patinhas e dos salvos, compartilhado pelas três direções.
export function usePostState() {
  const [liked, setLiked] = useState({});
  const [saved, setSaved] = useState({});
  return {
    liked,
    saved,
    toggleLike: (id) => setLiked((s) => ({ ...s, [id]: !s[id] })),
    toggleSave: (id) => setSaved((s) => ({ ...s, [id]: !s[id] })),
    paws: (post) => fmt(post.paws + (liked[post.id] ? 1 : 0)),
  };
}

export const FEED = POSTS;

// "Mel · com Pet Shop Bicho Bom" e a linha de local e hora.
export function PostHeader({ post, onMore, light, avatarSize = 36 }) {
  const t = useTheme();
  const pet = PETS[post.pet];
  const partner = post.partner ? PARTNERS[post.partner] : null;
  const main = light ? '#FFFFFF' : t.c.text;
  const sub = light ? 'rgba(255,255,255,0.86)' : t.c.text2;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <PetAvatar pet={pet} size={avatarSize} ring={2} gap={light ? 0 : 2} ringColor={light ? '#FFFFFF' : undefined} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text numberOfLines={1} style={{ color: main, fontSize: 15, fontWeight: '600' }}>{pet.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          {partner ? (
            <>
              <PartnerMark partner={partner} size={15} />
              <Text numberOfLines={1} style={{ color: sub, fontSize: 13, marginLeft: 5, flexShrink: 1 }}>{partner.name} · {post.time}</Text>
            </>
          ) : (
            <Text numberOfLines={1} style={{ color: sub, fontSize: 13 }}>{post.place} · {post.time}</Text>
          )}
        </View>
      </View>
      <Tap onPress={onMore} label="Mais opções: denunciar, bloquear" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="more" size={22} color={light ? '#FFFFFF' : t.c.text2} />
      </Tap>
    </View>
  );
}

export function Caption({ post, style }) {
  const t = useTheme();
  const pet = PETS[post.pet];
  return (
    <View style={style}>
      <Text style={{ color: t.c.text, fontSize: 15, lineHeight: 21 }}>
        <Text style={{ fontWeight: '600' }}>{pet.name}  </Text>
        {post.caption}
      </Text>
      <Text style={{ color: t.c.text2, fontSize: 13.5, marginTop: 6 }}>Ver os {post.comments} comentários</Text>
    </View>
  );
}

// Linha de nota, distância, preço e horário de um parceiro.
export function PartnerFacts({ partner, color }) {
  const t = useTheme();
  const c = color || t.c.text2;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 3 }}>
      <Icon name="star" size={13} color={t.toneText} filled />
      <Text style={{ color: c, fontSize: 13, marginLeft: 3 }}>{partner.rating} ({partner.reviews}) · {partner.distance} · {partner.price}</Text>
    </View>
  );
}
