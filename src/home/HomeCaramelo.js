import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Icon } from '../icons';
import { Tap, PetAvatar, PartnerMark, PostMedia, Label } from '../ui';
import { useTheme, alpha } from '../theme';
import { PETS, PARTNERS, WEEK, TODAY_INDEX, AGENDA, STORIES } from '../data';
import { usePostState, useHome, PostHeader, Caption, PartnerFacts } from './shared';

// Direção 2, Caramelo: a marca aparece mais. Faixa tingida no topo, dias em
// pílulas, o cartão "Hoje" preenchido de caramelo e posts em moldura.

export default function HomeCaramelo({ onSwitchPet, onPetList, onMore, bottomPad }) {
  const t = useTheme();
  const { c } = t;
  const ps = usePostState();
  const h = useHome();
  const [open, setOpen] = useState(true);
  const [day, setDay] = useState(TODAY_INDEX);
  const agenda = AGENDA[t.pet.key] || {};
  const item = agenda[day];
  const partner = item && item.partner ? PARTNERS[item.partner] : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>
      {/* Faixa do topo */}
      <View style={{ backgroundColor: c.surface2, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingTop: 12, paddingBottom: 58 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
          <Tap onPress={onSwitchPet} onLongPress={onPetList} label={`Pet ativo: ${t.pet.name}. Toque para trocar, segure para ver todos.`}>
            <PetAvatar pet={t.pet} size={52} ring={3} gap={2} />
          </Tap>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: c.text, fontFamily: t.fonts.title, fontSize: 28, lineHeight: 33 }}>{t.pet.name}</Text>
            <Text numberOfLines={1} style={{ color: c.text2, fontSize: 13.5 }}>{t.pet.breed}</Text>
          </View>
          <RingButton icon="bell" label="Notificações" dot onPress={h.notifications} />
          <View style={{ width: 8 }} />
          <RingButton icon="chat" label="Mensagens" onPress={h.dms} />
          <View style={{ width: 8 }} />
          <RingButton icon="plus" label="Criar: postar, agendar ou registrar cuidado" onPress={h.create} />
        </View>

        <Tap onPress={() => setOpen(!open)} scale={0.99} hitSlop={0} label={open ? 'Recolher a semana' : 'Abrir a semana'}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 44, marginTop: 8 }}>
          <Text style={{ flex: 1, color: c.text, fontFamily: t.fonts.title, fontSize: 17 }}>Esta semana</Text>
          <Text style={{ color: c.text2, fontSize: 13, marginRight: 6 }}>{Object.keys(agenda).length} compromissos</Text>
          <Icon name={open ? 'chevUp' : 'chevDown'} size={18} color={c.text2} />
        </Tap>
        {open ? (
          <View style={{ flexDirection: 'row', paddingHorizontal: 14 }}>
            {WEEK.map((d, i) => {
              const today = i === TODAY_INDEX;
              const sel = i === day;
              return (
                <Tap key={d.day} onPress={() => setDay(i)} outerStyle={{ flex: 1 }} hitSlop={0} label={`${d.label}, dia ${d.day}`}
                  style={{
                    marginHorizontal: 3, height: 66, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: today ? c.accent : c.surface,
                    borderWidth: sel && !today ? 1.5 : 0, borderColor: c.accentText,
                  }}>
                  <Text style={{ color: today ? c.onAccent : c.text2, fontSize: 11.5 }}>{d.label}</Text>
                  <Text style={{ color: today ? c.onAccent : c.text, fontFamily: t.fonts.title, fontSize: 18, lineHeight: 24 }}>{d.day}</Text>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: agenda[i] ? (today ? c.onAccent : t.petColor) : 'transparent' }} />
                </Tap>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Cartão Hoje, sobre a borda da faixa */}
      <View style={{ marginHorizontal: 16, marginTop: -42, backgroundColor: item ? c.accent : c.surface, borderRadius: t.radius.card, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: item ? c.onAccent : c.accentText, fontSize: 12.5, fontWeight: '600', letterSpacing: 0.6 }}>
              {day === TODAY_INDEX ? 'HOJE' : `${WEEK[day].label.toUpperCase()}, DIA ${WEEK[day].day}`}
            </Text>
            <Text style={{ color: item ? c.onAccent : c.text, fontFamily: t.fonts.title, fontSize: 22, lineHeight: 28, marginTop: 2 }}>
              {item ? `${item.title}${item.done ? '' : ' às ' + item.time}` : 'Dia livre'}
            </Text>
          </View>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: item ? alpha(c.onAccent, 0.14) : c.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={item ? item.icon : 'calendar'} size={24} color={item ? c.onAccent : c.accentText} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          {partner ? <PartnerMark partner={partner} size={30} /> : null}
          <Text numberOfLines={2} style={{ flex: 1, color: item ? c.onAccent : c.text2, fontSize: 14, marginLeft: partner ? 10 : 0 }}>
            {item ? item.where : `Nada marcado para ${t.pet.article === 'do' ? 'o' : 'a'} ${t.pet.name}. Um passeio cai bem.`}
          </Text>
          {item && !item.done ? (
            <Tap onPress={() => h.openDay(item)} label="Ver agendamento" style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: c.onAccent, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
              <Text style={{ color: t.dark ? c.accent : '#FFF4E2', fontSize: 14, fontWeight: '600' }}>Ver</Text>
            </Tap>
          ) : null}
        </View>
      </View>

      {/* Histórias, com o status do pet */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 }}>
        <Tap onPress={h.newStory} label="Criar sua história" style={{ alignItems: 'center', marginRight: 12, width: 76 }}>
          <View>
            <PetAvatar pet={t.pet} size={62} muted ring={2} />
            <View style={{ position: 'absolute', right: -1, bottom: -1, width: 24, height: 24, borderRadius: 12, backgroundColor: c.accent, borderWidth: 2, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={13} color={c.onAccent} stroke={2.4} />
            </View>
          </View>
          <Text style={{ color: c.text2, fontSize: 12, marginTop: 6 }}>Sua história</Text>
        </Tap>
        {STORIES.map((k) => (
          <Tap key={k} onPress={() => h.story(k)} style={{ alignItems: 'center', marginRight: 12, width: 76 }} label={`História ${PETS[k].article} ${PETS[k].name}`}>
            <PetAvatar pet={k} size={62} ring={3} ringColor={c.accent} />
            <Text numberOfLines={1} style={{ color: c.text, fontSize: 12.5, marginTop: 6 }}>{PETS[k].name}</Text>
            {PETS[k].status ? <Text numberOfLines={1} style={{ color: c.accentText, fontSize: 11.5 }}>{PETS[k].status}</Text> : null}
          </Tap>
        ))}
      </ScrollView>

      {/* Feed */}
      {ps.feed.map((post) => {
        if (post.type === 'suggestion') return <Suggestion key={post.id} post={post} />;
        if (post.type === 'sponsored') return <Sponsored key={post.id} post={post} onMore={onMore} />;
        const liked = !!ps.liked[post.id];
        const saved = !!ps.saved[post.id];
        const tagged = post.partner ? PARTNERS[post.partner] : null;
        return (
          <View key={post.id} style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: c.surface, borderRadius: t.radius.card, padding: 10 }}>
            <View style={{ paddingLeft: 4, paddingBottom: 8 }}>
              <PostHeader post={{ ...post, partner: null }} onMore={onMore} avatarSize={38} />
            </View>
            <PostMedia post={post} liked={liked} onLike={() => ps.toggleLike(post.id)} radius={16} />
            {tagged ? (
              <Tap scale={0.98} onPress={() => h.book(tagged.key)} label={`Ver ${tagged.name}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface2, borderRadius: 14, padding: 8, marginTop: 8 }}>
                <PartnerMark partner={tagged} size={32} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text numberOfLines={1} style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{tagged.name}</Text>
                  <Text style={{ color: c.text2, fontSize: 12.5 }}>Banho e tosa · {tagged.area}</Text>
                </View>
                <Text style={{ color: c.accentText, fontSize: 14, fontWeight: '600', marginRight: 6 }}>Agendar</Text>
              </Tap>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <Pill icon="paw" text={ps.paws(post)} active={liked} onPress={() => ps.toggleLike(post.id)} label="Dar patinha" />
              <Pill icon="comment" text={String(post.comments)} onPress={() => h.post(post.id)} label="Comentar" />
              <Pill icon="share" onPress={() => h.share(post.id)} label="Compartilhar" />
              <View style={{ flex: 1 }} />
              <Pill icon="bookmark" active={saved} onPress={() => ps.toggleSave(post.id)} label="Salvar" last />
            </View>
            <Caption post={post} style={{ paddingHorizontal: 4, paddingTop: 10, paddingBottom: 6 }} />
          </View>
        );
      })}
    </ScrollView>
  );
}

function RingButton({ icon, label, dot, onPress }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} label={label} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.c.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={22} color={t.c.text} />
      {dot ? <View style={{ position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: t.c.accent, borderWidth: 1.5, borderColor: t.c.surface }} /> : null}
    </Tap>
  );
}

function Pill({ icon, text, active, onPress, label, last }) {
  const t = useTheme();
  const { c } = t;
  return (
    <Tap onPress={onPress} label={label} scale={0.94} hitSlop={2}
      style={{ flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 13, borderRadius: 22, marginRight: last ? 0 : 8, backgroundColor: active ? c.accent : c.surface2 }}>
      <Icon name={icon} size={21} color={active ? c.onAccent : c.text} filled={active} />
      {text ? <Text style={{ color: active ? c.onAccent : c.text, fontSize: 14, marginLeft: 6, fontWeight: active ? '600' : '400' }}>{text}</Text> : null}
    </Tap>
  );
}

function Sponsored({ post, onMore }) {
  const t = useTheme();
  const h = useHome();
  const { c } = t;
  const partner = PARTNERS[post.partner];
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: c.surface, borderRadius: t.radius.card, padding: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 4, paddingBottom: 8 }}>
        <PartnerMark partner={partner} size={40} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ color: c.text, fontSize: 15, fontWeight: '600', flexShrink: 1 }}>{partner.name}</Text>
            <View style={{ marginLeft: 4 }}><Icon name="verified" size={15} color={c.accentText} /></View>
          </View>
          <Label color={c.text2} bg={c.surface2} style={{ marginTop: 3 }}>Patrocinado</Label>
        </View>
        <Tap onPress={onMore} label="Mais opções" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more" size={22} color={c.text2} />
        </Tap>
      </View>
      <PostMedia post={post} liked onLike={() => {}} radius={16} />
      <Text style={{ color: c.text, fontSize: 15, lineHeight: 21, paddingHorizontal: 4, paddingTop: 10 }}>{post.caption}</Text>
      <Tap style={{ marginTop: 12, height: 46, borderRadius: 23, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }} onPress={() => h.partner(post.partner)} label={post.cta}>
        <Text style={{ color: c.accentText, fontSize: 15, fontWeight: '600' }}>{post.cta}</Text>
      </Tap>
    </View>
  );
}

function Suggestion({ post }) {
  const t = useTheme();
  const h = useHome();
  const { c } = t;
  const partner = PARTNERS[post.partner];
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: c.surface2, borderRadius: t.radius.card, padding: 14 }}>
      <Text style={{ color: c.text, fontFamily: t.fonts.title, fontSize: 17 }}>Perto de você</Text>
      <Text style={{ color: c.text2, fontSize: 12.5 }}>Sugestão do netpet</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: c.surface, borderRadius: 18, padding: 12 }}>
        <PartnerMark partner={partner} size={52} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{partner.name}</Text>
          <PartnerFacts partner={partner} />
          <Text style={{ color: c.text2, fontSize: 13, marginTop: 2 }}>Aberto · vaga {partner.nextSlot}</Text>
        </View>
      </View>
      <Tap style={{ marginTop: 12, height: 46, borderRadius: 23, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }} onPress={() => h.book(post.partner)} label="Agendar banho">
        <Text style={{ color: c.onAccent, fontSize: 15, fontWeight: '600' }}>Agendar banho</Text>
      </Tap>
    </View>
  );
}
