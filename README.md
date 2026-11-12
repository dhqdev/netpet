# netpet

Protótipo do app netpet em Expo (React Native). Etapa 1: a tela Início em três direções visuais (Aveia, Caramelo e Cor do pet), com tema claro e escuro.

## Abrir no celular com o Expo Go

1. Instale o Expo Go no celular (App Store ou Google Play).
2. No computador, com Node 20 ou mais novo:

   ```bash
   npm install
   npx expo start
   ```

3. Com o celular na mesma rede Wi-Fi, aponte a câmera (iPhone) ou o leitor do Expo Go (Android) para o QR code do terminal. Se a rede bloquear, use `npx expo start --tunnel`.

Para ver no navegador: `npx expo start --web`.

## O que dá para testar

- A faixa escura no topo é do protótipo, não do app: troca a direção visual e o tema.
- Toque no avatar para trocar de pet (Paçoca, Luna, Amora). Segure para abrir a lista.
- Toque nos dias da semana, recolha a semana, toque duas vezes na foto para dar patinha.
- O botão "+" abre a folha Criar. As outras abas chegam nas próximas etapas.

## Estrutura

- `App.js`: moldura do protótipo, barra inferior e folhas.
- `src/theme.js`: tokens de cor, fonte e raio das três direções.
- `src/icons.js`: conjunto único de ícones em traço de 1,7.
- `src/data.js`: conteúdo de exemplo (pets, parceiros, agenda, posts).
- `src/ui.js`: peças comuns (toque, avatar, marca de parceiro, mídia do post, folha).
- `src/home/`: a tela Início em cada direção.

Fotos de exemplo do Unsplash (IDs em `assets/photos/unsplash-ids.json`). Fontes Nunito, Fredoka e Baloo 2, sob a licença OFL. Nenhum código, ícone ou imagem do openGym foi usado.
