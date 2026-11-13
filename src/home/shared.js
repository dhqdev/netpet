import React from 'react';
import { Text, View } from 'react-native';
import { Icon } from '../icons';
import { Tap, PetAvatar, PartnerMark } from '../ui';
import { useTheme } from '../theme';
import { PETS, PARTNERS, fmt } from '../data';
import { useStore } from '../store';
import { useNav } from '../nav';

// Patinhas, salvos e o feed vêm do estado do app, compartilhado pelas três direções.
export function usePostState() {
  const s = useStore();
  return {
    feed: s.posts,
    liked: s.liked,
    saved: s.saved,
    toggleLike: s.toggleLike,
    toggleSave: (id) => { if (!s.saved[id]) s.toast('Salvo na sua coleção'); s.toggleSave(id); },
    paws: (post) => fmt(post.paws + (s.liked[post.id] ? 1 : 0)),
  };
}

// Para onde cada toque do Início leva.
export function useHome() {
  const s = useStore();
  const nav = useNav();
  return {
    notifications: () => nav.push('Notifications'),
    dms: () => nav.push('Dms'),
    story: (pet) => nav.push('Story', { pet }),
    newStory: () => nav.push('NewPost', {}),
    post: (id) => nav.push('Post', { id }),
    share: (id) => s.openSheet('share', { post: id }),
    partner: (id) => nav.push('Partner', { id }),
    book: (partner) => nav.push('Booking', { partner }),
    openDay: (item) => {
      if (!item) return nav.push('Results', { category: 'passeador' });
      if (item.booking) {
        const b = s.bookings.find((x) => x.id === item.booking);
        return nav.push(b && b.status === 'live' ? 'Live' : 'BookingDetail', { id: item.booking });
      }
      return nav.push('CareSchedule', { pet: s.petKey });
    },
  };
}

// "Mel · com Pet Shop Bicho Bom" e a linha de local e hora.
export function PostHeader({ post, onMore, light, avatarSize = 36 }) {
  const t = useTheme();
  const pet = PETS[post.pet];
  const partner = post.partner ? PARTNERS[post.partner] : null;
  const s = useStore();
  const nav = useNav();
  const main = light ? '#FFFFFF' : t.c.text;
  const sub = light ? 'rgba(255,255,255,0.86)' : t.c.text2;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Tap onPress={() => nav.push('PetProfile', { pet: pet.key })} label={`Perfil ${pet.article} ${pet.name}`} hitSlop={2}>
        <PetAvatar pet={pet} size={avatarSize} ring={2} gap={light ? 0 : 2} ringColor={light ? '#FFFFFF' : undefined} />
      </Tap>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text onPress={() => nav.push('PetProfile', { pet: pet.key })} numberOfLines={1} style={{ color: main, fontSize: 15, fontWeight: '600', alignSelf: 'flex-start' }}>{pet.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          {partner ? (
            <>
              <PartnerMark partner={partner} size={15} />
              <Text onPress={() => nav.push('Partner', { id: partner.key })} numberOfLines={1} style={{ color: sub, fontSize: 13, marginLeft: 5, flexShrink: 1 }}>{partner.name} · {post.time}</Text>
            </>
          ) : (
            <Text numberOfLines={1} style={{ color: sub, fontSize: 13 }}>{post.place} · {post.time}</Text>
          )}
        </View>
      </View>
      <Tap onPress={() => (post.mine ? s.openSheet('mine', { post: post.id }) : s.openSheet('more', { post: post.id, who: pet.name }))} label="Mais opções: denunciar, bloquear" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="more" size={22} color={light ? '#FFFFFF' : t.c.text2} />
      </Tap>
    </View>
  );
}

export function Caption({ post, style }) {
  const t = useTheme();
  const nav = useNav();
  const pet = PETS[post.pet];
  return (
    <View style={style}>
      <Text style={{ color: t.c.text, fontSize: 15, lineHeight: 21 }}>
        <Text style={{ fontWeight: '600' }}>{pet.name}  </Text>
        {post.caption}
      </Text>
      <Text onPress={() => nav.push('Post', { id: post.id })} style={{ color: t.c.text2, fontSize: 13.5, marginTop: 6, alignSelf: 'flex-start', paddingVertical: 4 }}>
        {post.comments ? `Ver os ${post.comments} comentários` : 'Comentar'}
      </Text>
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
