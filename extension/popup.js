const allowedHosts = new Set([
  'affiliate.shopee.com.br',
  'www.mercadolivre.com.br',
  'associados.amazon.com.br',
  'br.shein.com',
  'business.facebook.com',
  'www.instagram.com',
  'www.tiktok.com',
  'discord.com',
  'x.com',
]);

const status = document.querySelector('#status');

document.querySelectorAll('.link-card[data-url]').forEach((button) => {
  button.addEventListener('click', () => {
    const url = new URL(button.dataset.url);
    if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
      status.textContent = 'Este endereço não está na lista de sites permitidos.';
      return;
    }

    chrome.tabs.create({ url: url.href }, () => {
      if (chrome.runtime.lastError) {
        status.textContent = 'Não foi possível abrir o site. Tente novamente.';
      }
    });
  });
});
