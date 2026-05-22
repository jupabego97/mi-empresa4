/**
 * NANOTRONICS theme — cart drawer, AJAX add to cart, variant picker
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

  function formatMoney(cents) {
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney && window.theme?.moneyFormat) {
      return Shopify.formatMoney(cents, window.theme.moneyFormat);
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function renderPrice(variant) {
    let compareHtml = '';
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      const pct = Math.round(((variant.compare_at_price - variant.price) * 100) / variant.compare_at_price);
      compareHtml = `<span class="nt-price__compare">${formatMoney(variant.compare_at_price)}</span><span class="nt-price__discount">-${pct}%</span>`;
    }
    return `<div class="nt-price nt-price--lg"><div class="nt-price__row"><span class="nt-price__current">${formatMoney(variant.price)}</span>${compareHtml}</div><span class="nt-price__installments text-ink-muted">Cuotas según Mercado Pago en checkout</span></div>`;
  }

  function initProductVariants() {
    const form = document.getElementById('product-form');
    const productJson = document.getElementById('product-json');
    if (!form || !productJson) return;

    let product;
    try {
      product = JSON.parse(productJson.textContent);
    } catch {
      return;
    }

    const variantSelect = form.querySelector('[name="id"]');
    if (!variantSelect || !product.variants?.length || !product.options?.length) return;

    let variantImages = {};
    const variantImagesEl = document.getElementById('product-variant-images');
    if (variantImagesEl) {
      try {
        variantImages = JSON.parse(variantImagesEl.textContent);
      } catch {
        variantImages = {};
      }
    }

    const optionCount = product.options.length;
    const addBtn = document.getElementById('product-add-btn');
    const addLabel = document.getElementById('product-add-btn-label');
    const addLabelDefault = addLabel?.textContent?.trim() || 'Agregar al carrito';
    const stickyAddBtn = document.querySelector('.nt-sticky-bar button[form="product-form"]');

    function getSelectedOptions() {
      const selected = [];
      for (let i = 0; i < optionCount; i += 1) {
        const pos = i + 1;
        const input = form.querySelector(`.variant-option-input[data-option-position="${pos}"]:checked:not(:disabled)`);
        const fallback = form.querySelector(`.variant-option-input[data-option-position="${pos}"]:not(:disabled)`);
        selected.push(input?.value || fallback?.value || product.variants[0]?.options[i]);
      }
      return selected;
    }

    function findVariant(options) {
      return product.variants.find((variant) => variant.options.every((opt, i) => opt === options[i]));
    }

    function comboExists(options) {
      return product.variants.some((variant) => variant.options.every((opt, i) => opt === options[i]));
    }

    function comboAvailable(options) {
      return product.variants.some((variant) => variant.available && variant.options.every((opt, i) => opt === options[i]));
    }

    function updateOptionAvailability() {
      const selected = getSelectedOptions();
      for (let i = 0; i < optionCount; i += 1) {
        const pos = i + 1;
        form.querySelectorAll(`.variant-option-input[data-option-position="${pos}"]`).forEach((input) => {
          const testOptions = [...selected];
          testOptions[i] = input.value;
          const exists = comboExists(testOptions);
          const available = comboAvailable(testOptions);
          input.disabled = !exists || !available;
          const pill = input.closest('.variant-option-label')?.querySelector('.variant-option-pill');
          if (pill) {
            pill.classList.toggle('is-unavailable', exists && !available);
            pill.classList.toggle('is-disabled', !exists);
          }
        });
      }
    }

    function setAvailabilityUI(available) {
      [addBtn, stickyAddBtn].forEach((btn) => {
        if (btn) btn.disabled = !available;
      });
      if (addLabel) {
        addLabel.textContent = available ? addLabelDefault : 'Agotado';
      }

      const stockStatus = document.getElementById('product-stock-status');
      const stockDot = document.getElementById('product-stock-dot');
      const stockText = document.getElementById('product-stock-text');
      if (stockStatus && stockText && stockDot) {
        stockStatus.classList.toggle('text-success', available);
        stockStatus.classList.toggle('text-danger', !available);
        stockDot.classList.toggle('bg-success', available);
        stockDot.classList.toggle('bg-danger', !available);
        stockText.textContent = available
          ? 'En stock · despacho según disponibilidad (consulta tiempos en checkout)'
          : 'Agotado por ahora · pregúntanos cuándo vuelve';
      }
    }

    function updateUI(variant) {
      if (!variant) {
        setAvailabilityUI(false);
        return;
      }

      variantSelect.value = String(variant.id);

      const priceBlock = document.getElementById('product-price-block');
      if (priceBlock) {
        const priceEl = priceBlock.querySelector('.nt-price');
        if (priceEl) priceEl.outerHTML = renderPrice(variant);
      }

      const stickyPrice = document.querySelector('[data-price-current]');
      if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);

      const skuEl = document.getElementById('product-sku');
      if (skuEl) skuEl.textContent = variant.sku || 'N/A';

      setAvailabilityUI(variant.available);

      variant.options.forEach((val, i) => {
        const label = document.querySelector(`[data-option-current="${i + 1}"]`);
        if (label) label.textContent = val;
      });

      const imageIndex = variantImages[String(variant.id)];
      if (imageIndex !== undefined && imageIndex !== null) {
        window.dispatchEvent(new CustomEvent('variant-image', { detail: Number(imageIndex) }));
      }

      if (window.history?.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    function onOptionChange(changedInput) {
      if (changedInput) {
        const pos = changedInput.dataset.optionPosition;
        const label = document.querySelector(`[data-option-current="${pos}"]`);
        if (label) label.textContent = changedInput.value;
      }

      updateOptionAvailability();
      updateUI(findVariant(getSelectedOptions()));
    }

    form.querySelectorAll('.variant-option-input').forEach((input) => {
      input.addEventListener('change', () => onOptionChange(input));
    });

    updateOptionAvailability();
    updateUI(findVariant(getSelectedOptions()) || product.variants.find((v) => v.available) || product.variants[0]);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('js-ready');
    initProductVariants();

    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (form.id !== 'product-form' || !form.classList.contains('ajax-cart')) return;
      if (e.submitter?.name !== 'add') return;

      e.preventDefault();
      const btn = document.getElementById('product-add-btn');
      if (btn?.disabled) return;
      if (btn) btn.disabled = true;

      try {
        const fd = new FormData(form);
        await addToCart(fd);
      } catch (err) {
        form.submit();
      } finally {
        const variantSelect = form.querySelector('[name="id"]');
        const variantId = variantSelect?.value;
        const productJson = document.getElementById('product-json');
        let stillAvailable = true;
        if (productJson && variantId) {
          try {
            const product = JSON.parse(productJson.textContent);
            const variant = product.variants.find((v) => String(v.id) === String(variantId));
            stillAvailable = variant?.available !== false;
          } catch {
            stillAvailable = true;
          }
        }
        if (btn) btn.disabled = !stillAvailable;
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
