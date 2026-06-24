# Wallet — TWA (app Android)

Cáscara Android (Trusted Web Activity) de `wallet.dotrino.com`, generada con
[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap). Abre `.ics`/`.pkpass`
("Abrir con") y corre la PWA sin barra de URL.

Solo se versiona `twa-manifest.json`. El proyecto Android se **regenera**:
```sh
npx -y @bubblewrap/cli@latest update --skipVersionUpgrade
```
Build del APK: ver **[`/TWA.md`](../../TWA.md)** (requiere el keystore `wallet-release.jks`,
que NO está en git). Distribución: release `twa-v1.0.0` (asset `wallet.apk`).

Paquete: `com.dotrino.wallet` · firma SHA-256 en `wallet.dotrino.com/.well-known/assetlinks.json`.
