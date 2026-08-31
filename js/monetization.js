/* Replace simulateAd / buyProduct with AdMob + Play Billing / StoreKit. */

export const PRODUCTS = [
  { id: "coins_200", title: { ua: "200 монет", en: "200 coins" }, price: "$0.99", coins: 200, type: "consumable" },
  { id: "coins_1200", title: { ua: "1200 монет", en: "1,200 coins" }, price: "$4.99", coins: 1200, type: "consumable" },
  { id: "starter", title: { ua: "Стартовий пак", en: "Starter pack" }, price: "$2.99", coins: 500, lives: 5, type: "consumable" },
  { id: "no_ads", title: { ua: "Прибрати рекламу", en: "Remove ads" }, price: "$4.99", noAds: true, type: "nonconsumable" },
  { id: "undo_pack", title: { ua: "10 відмін", en: "10 undos" }, price: "$1.99", undos: 10, type: "consumable" }
];

export function shouldShowInterstitial(state) {
  if (state.noAds) return false;
  return state.totalWins > 0 && state.totalWins % 3 === 0;
}

export function simulateAd(kind = "rewarded") {
  return new Promise(resolve => {
    const ms = kind === "rewarded" ? 1400 : 900;
    setTimeout(() => resolve({ ok: true, kind }), ms);
  });
}

export function buyProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  return Promise.resolve({ ok: !!p, product: p });
}
