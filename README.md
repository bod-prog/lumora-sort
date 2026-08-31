# Lumora Sort

Гібрид-casual sort-головоломка під телефон. Жанр Sort зараз один із найбільш прибуткових у puzzle (реклама + IAP).

Це **готова гра**, не концепт: рівні, життя, щоденний виклик, магазин, рекламні заглушки.

Repo: https://github.com/bod-prog/lumora-sort

## Як пограти зараз

```bash
cd lumora-sort
python3 -m http.server 8080
```

На Android/iPhone додайте на домашній екран — це PWA.

GitHub Pages: Settings → Pages → Deploy from branch `main`.

## Монетизація

У `js/monetization.js`: rewarded ads, interstitial, banner, IAP (coins, starter pack, undos, remove ads).

Прибуток не гарантований. Це готовий продукт для софт-лончу, не друкарня.
