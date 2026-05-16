/**
 * NANOTRONICS theme — cart drawer, AJAX add to cart
 */
(function () {
  const routes = window.Shopify?.routes || { root: '/' };
  const root = routes.root?.endsWith('/') ? routes.root : `${routes.root || '/'}/`;

  async function fetchCart() {
    const res = await fetch(`${root}cart.js`);
    return res.json();
  }

  function updateCartBadge(count) {
    document.querySelectorAll('.cart-count-badge').forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  async function refreshCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    try {
      const res = await fetch(`${window.location.pathname}${window.location.search}&section_id=cart-drawer`.replace('?&', '?'));
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newDrawer = doc.getElementById('cart-drawer');
      if (newDrawer) {
        drawer.outerHTML = newDrawer.outerHTML;
      }
    } catch (e) {
      console.warn('[NANOTRONICS] cart refresh', e);
    }
  }

  async function addToCart(formData) {
    const res = await fetch(`${root}cart/add.js`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    if (!res.ok) throw new Error('Add to cart failed');
    const data = await res.json();
    const cart = await fetchCart();
    updateCartBadge(cart.item_count);
    window.dispatchEvent(new CustomEvent('open-cart'));
    await refreshCartDrawer();
    return data;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('js-ready');

    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (form.id !== 'product-form' || !form.classList.contains('ajax-cart')) return;
      if (e.submitter?.name !== 'add') return;

      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;

      try {
        const fd = new FormData(form);
        await addToCart(fd);
      } catch (err) {
        form.submit();
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    document.addEventListener('change', async (e) => {
      if (!e.target.classList.contains('cart-qty-input')) return;
      const key = e.target.dataset.lineKey;
      const qty = parseInt(e.target.value, 10);
      await fetch(`${root}cart/change.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity: qty }),
      });
      window.location.reload();
    });
  });
})();
