import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../icons';
import { Tap, PetAvatar, PartnerMark, PostMedia, Photo, Label } from '../ui';
import { useTheme, alpha } from '../theme';
import { PETS, PARTNERS, WEEK, TODAY_INDEX, AGENDA, STORIES } from '../data';
import { usePostState, useHome, PostHeader, Caption, PartnerFacts } from './shared';

// Direção 3, Cor do pet: neutros de pedra e o tom do pet ativo no topo, no dia
// de hoje e na patinha. Fotos de ponta a ponta, com as ações sobre a imagem.

export default function HomePet({ onSwitchPet, onPetList, onMore, bottomPad }) {
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
      <LinearGradient
        colors={[alpha(t.petColor, t.dark ? 0.3 : 0.34), alpha(t.petColor, 0)]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 300 }}
        pointerEvents="none"
      />

      {/* Cabeçalho */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 }}>
        <Tap onPress={onSwitchPet} onLongPress={onPetList} label={`Pet ativo: ${t.pet.name}. Toque para trocar, segure para ver todos.`}>
          <PetAvatar pet={t.pet} size={56} ring={3} gap={3} status />
        </Tap>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: c.text, fontFamily: t.fonts.title, fontSize: 28, lineHeight: 34 }}>{t.pet.name}</Text>
          <Text numberOfLines={1} style={{ color: c.text2, fontSize: 13.5, marginTop: -2 }}>{t.pet.status} · {t.pet.age}</Text>
        </View>
        <PlainButton icon="bell" label="Notificações" dot onPress={h.notifications} />
        <PlainButton icon="chat" label="Mensagens" onPress={h.dms} />
          <PlainButton icon="plus" label="Criar: postar, agendar ou registrar cuidado" onPress={h.create} />
      </View>

      {/* Semana em linha, sem cartão */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 14 }}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {(open ? WEEK : []).map((d, i) => {
            const today = i === TODAY_INDEX;
            const sel = i === day;
            return (
              <Tap key={d.day} onPress={() => setDay(i)} outerStyle={{ flex: 1 }} hitSlop={0} label={`${d.label}, dia ${d.day}`}
                style={{ alignItems: 'center', justifyContent: 'center', height: 58, marginHorizontal: 2, borderRadius: 16, backgroundColor: today ? t.petColor : sel ? alpha(t.petColor, 0.2) : 'transparent' }}>
                <Text style={{ color: today ? t.pet.onColor : c.text2, fontSize: 11.5 }}>{d.label}</Text>
                <Text style={{ color: today ? t.pet.onColor : c.text, fontSize: 16, fontWeight: today ? '600' : '400', marginTop: 1 }}>{d.day}</Text>
                <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 3, backgroundColor: agenda[i] ? (today ? t.pet.onColor : t.petText) : 'transparent' }} />
              </Tap>
            );
          })}
          {!open ? (
            <Text style={{ color: c.text2, fontSize: 14, paddingLeft: 8, lineHeight: 44 }}>Semana de 9 a 15 de novembro</Text>
          ) : null}
        </View>
        <Tap onPress={() => setOpen(!open)} label={open ? 'Recolher a semana' : 'Abrir a semana'} style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={open ? 'chevUp' : 'chevDown'} size={18} color={c.text2} />
        </Tap>
      </View>

      {/* Hoje, em formato de bilhete */}
      <Tap scale={0.99} hitSlop={0} onPress={() => h.openDay(item)} label="Compromisso do dia"
        style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 10, backgroundColor: c.surface, borderRadius: t.radius.card, overflow: 'hidden', minHeight: 84 }}>
        <View style={{ width: 88, backgroundColor: alpha(t.petColor, t.dark ? 0.24 : 0.22), alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
          <Text style={{ color: t.petText, fontSize: 12, fontWeight: '600' }}>{day === TODAY_INDEX ? 'Hoje' : WEEK[day].label}</Text>
          <Text style={{ color: c.text, fontFamily: t.fonts.titleStrong, fontSize: 26, lineHeight: 32 }}>
            {item && !item.done ? item.time : item ? 'feito' : 'livre'}
          </Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 14, justifyContent: 'center', paddingVertical: 12 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{item ? item.title : 'Nada marcado'}</Text>
          <Text numberOfLines={2} style={{ color: c.text2, fontSize: 13.5, marginTop: 2 }}>
            {item ? item.where : 'Um bom dia para um passeio mais longo.'}
          </Text>
        </View>
        <View style={{ justifyContent: 'center', paddingRight: 12 }}>
          <Icon name="chevRight" size={18} color={c.text2} />
        </View>
      </Tap>

      {/* Histórias: cada anel na cor do próprio pet */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 2 }}>
        <Tap onPress={h.newStory} label="Criar sua história" style={{ alignItems: 'center', marginRight: 14 }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 1.7, borderColor: c.text2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={22} color={c.text} />
          </View>
          <Text style={{ color: c.text2, fontSize: 12, marginTop: 6 }}>Sua história</Text>
        </Tap>
        {STORIES.map((k) => (
          <Tap key={k} onPress={() => h.story(k)} style={{ alignItems: 'center', marginRight: 14 }} label={`História ${PETS[k].article} ${PETS[k].name}`}>
            <PetAvatar pet={k} size={58} ring={3} />
            <Text style={{ color: c.text, fontSize: 12, marginTop: 6 }}>{PETS[k].name}</Text>
          </Tap>
        ))}
      </ScrollView>

      {/* Feed de ponta a ponta */}
      {ps.feed.map((post) => {
        if (post.type === 'suggestion') return <Suggestion key={post.id} post={post} />;
        if (post.type === 'sponsored') return <Sponsored key={post.id} post={post} onMore={onMore} />;
        const liked = !!ps.liked[post.id];
        const saved = !!ps.saved[post.id];
        return (
          <View key={post.id} style={{ marginTop: 22 }}>
            <View style={{ paddingLeft: 16, paddingRight: 6, paddingBottom: 8 }}>
              <PostHeader post={post} onMore={onMore} avatarSize={38} />
            </View>
            <PostMedia post={post} liked={liked} onLike={() => ps.toggleLike(post.id)}>
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 96 }} pointerEvents="none"
              />
              <View style={{ position: 'absolute', right: 6, bottom: 10, alignItems: 'center' }}>
                <Over icon="paw" text={ps.paws(post)} active={liked} tone={t.dark ? t.pet.colorDark : t.pet.color} onPress={() => ps.toggleLike(post.id)} label="Dar patinha" />
                <Over icon="comment" text={String(post.comments)} onPress={() => h.post(post.id)} label="Comentar" />
                <Over icon="share" onPress={() => h.share(post.id)} label="Compartilhar" />
                <Over icon="bookmark" active={saved} onPress={() => ps.toggleSave(post.id)} label="Salvar" />
              </View>
            </PostMedia>
            <Caption post={post} style={{ paddingHorizontal: 16, paddingTop: 10 }} />
          </View>
        );
      })}
    </ScrollView>
  );
}

function PlainButton({ icon, label, dot, onPress }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} label={label} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={24} color={t.c.text} />
      {dot ? <View style={{ position: 'absolute', top: 10, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: t.petText }} /> : null}
    </Tap>
  );
}

function Over({ icon, text, active, onPress, label, tone }) {
  return (
    <Tap onPress={onPress} label={label} scale={0.88} hitSlop={0} style={{ width: 52, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 3 }}>
      <Icon name={icon} size={27} color={active && tone ? tone : '#FFFFFF'} filled={active} />
      {text ? <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginTop: 1 }}>{text}</Text> : null}
    </Tap>
  );
}

function Sponsored({ post, onMore }) {
  const t = useTheme();
  const h = useHome();
  const { c } = t;
  const partner = PARTNERS[post.partner];
  return (
    <View style={{ marginTop: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 6, paddingBottom: 8 }}>
        <PartnerMark partner={partner} size={40} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ color: c.text, fontSize: 15, fontWeight: '600', flexShrink: 1 }}>{partner.name}</Text>
            <View style={{ marginLeft: 4 }}><Icon name="verified" size={15} color={t.petText} /></View>
          </View>
          <Text style={{ color: c.text2, fontSize: 13, marginTop: 1 }}>Patrocinado · {partner.area}</Text>
        </View>
        <Tap onPress={onMore} label="Mais opções" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more" size={22} color={c.text2} />
        </Tap>
      </View>
      <PostMedia post={post} liked onLike={() => {}} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ flex: 1, color: c.text, fontSize: 14.5, lineHeight: 20, marginRight: 12 }}>{post.caption}</Text>
        <Tap onPress={() => h.partner(post.partner)} label={post.cta} style={{ height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: c.text, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.bg, fontSize: 14.5, fontWeight: '600' }}>Agendar</Text>
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
    <View style={{ marginHorizontal: 16, marginTop: 24, backgroundColor: c.surface, borderRadius: t.radius.card, padding: 12 }}>
      <View style={{ flexDirection: 'row' }}>
        <Photo name={partner.photo} style={{ width: 84, height: 84, borderRadius: 18 }} />
        <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
          <Label color={c.text2} bg={c.surface2}>Sugestão perto de você</Label>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '600', marginTop: 6 }}>{partner.name}</Text>
          <PartnerFacts partner={partner} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        <Text style={{ flex: 1, color: c.text2, fontSize: 13.5 }}>Aberto agora · vaga {partner.nextSlot}</Text>
        <Tap onPress={() => h.book(post.partner)} label="Agendar banho" style={{ height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: t.petColor, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: t.pet.onColor, fontSize: 14.5, fontWeight: '600' }}>Agendar banho</Text>
        </Tap>
      </View>
    </View>
  );
}
