import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Icon } from '../icons';
import { Tap, PetAvatar, PartnerMark, PostMedia, Photo, Hairline, Label } from '../ui';
import { useTheme, alpha } from '../theme';
import { PETS, PARTNERS, WEEK, TODAY_INDEX, TODAY_LONG, AGENDA, STORIES } from '../data';
import { usePostState, useHome, PostHeader, Caption, PartnerFacts } from './shared';

// Direção 1, Aveia: muito respiro, cartões brancos sobre o fundo aveia,
// separadores finíssimos e o caramelo só no dia de hoje, na patinha e nos botões.

export default function HomeAveia({ onSwitchPet, onPetList, onMore, bottomPad }) {
  const t = useTheme();
  const { c } = t;
  const ps = usePostState();
  const h = useHome();
  const [open, setOpen] = useState(true);
  const [day, setDay] = useState(TODAY_INDEX);
  const agenda = AGENDA[t.pet.key] || {};
  const item = agenda[day];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>
      {/* Cabeçalho */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 }}>
        <Tap onPress={onSwitchPet} onLongPress={onPetList} label={`Pet ativo: ${t.pet.name}. Toque para trocar, segure para ver todos.`}>
          <PetAvatar pet={t.pet} size={46} ring={2.5} />
        </Tap>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={1} style={{ color: c.text2, fontSize: 13.5 }}>{TODAY_LONG}</Text>
          <Text style={{ color: c.text, fontFamily: t.fonts.title, fontSize: 27, lineHeight: 33 }}>Oi, {t.pet.name}</Text>
        </View>
        <RoundButton icon="bell" label="Notificações" dot onPress={h.notifications} />
        <View style={{ width: 8 }} />
        <RoundButton icon="chat" label="Mensagens" onPress={h.dms} />
          <View style={{ width: 6 }} />
          <RoundButton icon="plus" label="Criar: postar, agendar ou registrar cuidado" onPress={h.create} />
      </View>

      {/* Semana e cartão Hoje */}
      <View style={{ marginHorizontal: 16, marginTop: 18, backgroundColor: c.surface, borderRadius: t.radius.card }}>
        <Tap onPress={() => setOpen(!open)} scale={0.99} hitSlop={0} label={open ? 'Recolher a semana' : 'Abrir a semana'}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 46 }}>
          <Text style={{ flex: 1, color: c.text, fontSize: 15, fontWeight: '600' }}>Semana {t.pet.article} {t.pet.name}</Text>
          <Text style={{ color: c.text2, fontSize: 13, marginRight: 6 }}>9 a 15 de nov</Text>
          <Icon name={open ? 'chevUp' : 'chevDown'} size={18} color={c.text2} />
        </Tap>
        {open ? (
          <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 12 }}>
            {WEEK.map((d, i) => {
              const today = i === TODAY_INDEX;
              const sel = i === day;
              return (
                <Tap key={d.day} onPress={() => setDay(i)} outerStyle={{ flex: 1 }} hitSlop={0} style={{ alignItems: 'center', minHeight: 62 }} label={`${d.label}, dia ${d.day}`}>
                  <Text style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>{d.short}</Text>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: today ? c.accent : 'transparent',
                    borderWidth: sel && !today ? 1.5 : 0, borderColor: c.accentText,
                  }}>
                    <Text style={{ color: today ? c.onAccent : c.text, fontSize: 15, fontWeight: today ? '600' : '400' }}>{d.day}</Text>
                  </View>
                  <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 5, backgroundColor: agenda[i] ? t.petColor : 'transparent' }} />
                </Tap>
              );
            })}
          </View>
        ) : null}
        <Hairline inset={16} />
        <Tap scale={0.99} hitSlop={0} style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }} onPress={() => h.openDay(item)} label="Compromisso do dia">
          <View style={{ width: 44, height: 44, borderRadius: t.radius.tile, backgroundColor: alpha(c.accent, t.dark ? 0.2 : 0.16), alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={item ? item.icon : 'calendar'} size={22} color={c.accentText} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: c.accentText, fontSize: 12.5, fontWeight: '600' }}>
              {day === TODAY_INDEX ? 'Hoje' : `${WEEK[day].label}, dia ${WEEK[day].day}`}
            </Text>
            <Text style={{ color: c.text, fontSize: 16, marginTop: 1 }}>
              {item ? `${item.title} · ${item.time}` : 'Nada marcado'}
            </Text>
            <Text numberOfLines={2} style={{ color: c.text2, fontSize: 13.5, marginTop: 1 }}>
              {item ? item.where : `Que tal marcar um passeio para ${t.pet.article === 'do' ? 'o' : 'a'} ${t.pet.name}?`}
            </Text>
          </View>
          <Icon name="chevRight" size={18} color={c.text2} />
        </Tap>
      </View>

      {/* Histórias */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 }}>
        <Tap onPress={h.newStory} label="Criar sua história" style={{ alignItems: 'center', marginRight: 14 }}>
          <View>
            <PetAvatar pet={t.pet} size={58} muted />
            <View style={{ position: 'absolute', right: -1, bottom: -1, width: 22, height: 22, borderRadius: 11, backgroundColor: c.accent, borderWidth: 2, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={12} color={c.onAccent} stroke={2.4} />
            </View>
          </View>
          <Text style={{ color: c.text2, fontSize: 12, marginTop: 6 }}>Sua história</Text>
        </Tap>
        {STORIES.map((k) => (
          <Tap key={k} onPress={() => h.story(k)} style={{ alignItems: 'center', marginRight: 14 }} label={`História ${PETS[k].article} ${PETS[k].name}`}>
            <PetAvatar pet={k} size={58} ringColor={c.accent} />
            <Text style={{ color: c.text, fontSize: 12, marginTop: 6 }}>{PETS[k].name}</Text>
          </Tap>
        ))}
      </ScrollView>

      {/* Feed */}
      {ps.feed.map((post) => {
        if (post.type === 'suggestion') return <Suggestion key={post.id} post={post} />;
        if (post.type === 'sponsored') return <Sponsored key={post.id} post={post} onMore={onMore} />;
        const liked = !!ps.liked[post.id];
        const saved = !!ps.saved[post.id];
        return (
          <View key={post.id} style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: c.surface, borderRadius: t.radius.card, overflow: 'hidden' }}>
            <View style={{ paddingLeft: 12, paddingRight: 4, paddingVertical: 10 }}>
              <PostHeader post={post} onMore={onMore} />
            </View>
            <PostMedia post={post} liked={liked} onLike={() => ps.toggleLike(post.id)} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 6 }}>
              <Action icon="paw" text={ps.paws(post)} active={liked} onPress={() => ps.toggleLike(post.id)} label="Dar patinha" />
              <Action icon="comment" text={String(post.comments)} onPress={() => h.post(post.id)} label="Comentar" />
              <Action icon="share" onPress={() => h.share(post.id)} label="Compartilhar" />
              <View style={{ flex: 1 }} />
              <Action icon="bookmark" active={saved} onPress={() => ps.toggleSave(post.id)} label="Salvar" neutral />
            </View>
            <Caption post={post} style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14 }} />
          </View>
        );
      })}
    </ScrollView>
  );
}

function RoundButton({ icon, label, dot, onPress }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} label={label} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.c.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={22} color={t.c.text} />
      {dot ? <View style={{ position: 'absolute', top: 11, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: t.c.accent, borderWidth: 1.5, borderColor: t.c.surface }} /> : null}
    </Tap>
  );
}

function Action({ icon, text, active, onPress, label, neutral }) {
  const t = useTheme();
  const color = active ? (neutral ? t.c.text : t.c.accentText) : t.c.text;
  return (
    <Tap onPress={onPress} label={label} scale={0.9} style={{ flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 8 }}>
      <Icon name={icon} size={24} color={active && !neutral ? t.c.accent : color} filled={active} />
      {text ? <Text style={{ color, fontSize: 14, marginLeft: 6 }}>{text}</Text> : null}
    </Tap>
  );
}

function Sponsored({ post, onMore }) {
  const t = useTheme();
  const h = useHome();
  const { c } = t;
  const partner = PARTNERS[post.partner];
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: c.surface, borderRadius: t.radius.card, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 4, paddingVertical: 10 }}>
        <PartnerMark partner={partner} size={38} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ color: c.text, fontSize: 15, fontWeight: '600', flexShrink: 1 }}>{partner.name}</Text>
            <View style={{ marginLeft: 4 }}><Icon name="verified" size={15} color={c.accentText} /></View>
          </View>
          <Text style={{ color: c.text2, fontSize: 13, marginTop: 1 }}>Patrocinado · {partner.area}</Text>
        </View>
        <Tap onPress={onMore} label="Mais opções" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more" size={22} color={c.text2} />
        </Tap>
      </View>
      <PostMedia post={post} liked onLike={() => {}} />
      <View style={{ padding: 14 }}>
        <Text style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>{post.caption}</Text>
        <Tap style={{ marginTop: 12, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: c.accentText, alignItems: 'center', justifyContent: 'center' }} onPress={() => h.partner(post.partner)} label={post.cta}>
          <Text style={{ color: c.accentText, fontSize: 15, fontWeight: '600' }}>{post.cta}</Text>
        </Tap>
      </View>
    </View>
  );
}

function Suggestion({ post }) {
  const t = useTheme();
  const h = useHome();
  const { c } = t;
  const partner = PARTNERS[post.partner];
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: c.surface, borderRadius: t.radius.card, padding: 14 }}>
      <Label color={c.text2} bg={c.surface2}>Sugestão perto de você</Label>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        <PartnerMark partner={partner} size={52} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{partner.name}</Text>
          <PartnerFacts partner={partner} />
          <Text style={{ color: c.text2, fontSize: 13, marginTop: 2 }}>Aberto agora · próximo horário {partner.nextSlot}</Text>
        </View>
      </View>
      <Tap style={{ marginTop: 14, height: 46, borderRadius: 23, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }} onPress={() => h.book(post.partner)} label="Agendar banho">
        <Text style={{ color: c.onAccent, fontSize: 15, fontWeight: '600' }}>Agendar banho</Text>
      </Tap>
    </View>
  );
}
