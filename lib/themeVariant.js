export function applyThemeVariant() {
  const theme = new URLSearchParams(window.location.search).get('tema');
  const isGreen = theme === 'verde';

  document.documentElement.dataset.theme = isGreen ? 'green' : 'red';

  if (!['verde', 'rojo'].includes(theme)) return;

  document.querySelectorAll('a[href]').forEach((anchor) => {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    url.searchParams.set('tema', theme);
    anchor.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
  });
}