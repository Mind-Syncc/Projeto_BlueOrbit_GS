# BlueOrbit – Space Safety Intelligence

## Instalação

```bash
cd BlueOrbit_expo
npm install
```

## Rodando

```bash
# Abre o QR code para Expo Go (mobile)
npx expo start

# Somente web (browser)
npx expo start --web

# Somente iOS (simulador Xcode necessário)
npx expo start --ios
```

Escaneie o QR code com o **Expo Go** no celular ou pressione `w` para abrir no browser.


## Estrutura

```
BlueOrbit_expo/
├── App.js                    # Entry point Expo
├── app.json                  # Config Expo
├── babel.config.js
├── package.json
└── src/
    ├── components/
    │   ├── BottomNav.js      # Nav inferior com SVG icons
    │   └── UI.js             # Card, Button, Input, badges
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── DashboardScreen.js
    │   ├── OrbitalMapScreen.js
    │   ├── AlertsScreen.js   # + AlertDetailScreen
    │   ├── SatelliteScreen.js
    │   ├── OccurrencesScreen.js  # + 4 sub-screens
    │   ├── NotificationsScreen.js
    │   └── ProfileScreen.js
    ├── styles/
    │   └── theme.js          # Cores e tokens de design
    └── utils/
        └── mockData.js       # Dados simulados
```

