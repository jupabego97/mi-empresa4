/**
 * NANOTRONICS theme — cart drawer, AJAX add to cart, variant picker
 */
(function () {
  const routes = window.Shopify?.routes || { root: '/' };
  const root = routes.root?.endsWith('/') ? routes.root : `${routes.root || '/'}/`;

  const LABELS = {
    add: 'Agregar al carrito',
    adding: 'Agregando...',
    added: 'Agregado',
    error: 'No se pudo agregar',
  };

  async function fetchCart() {
    const res = await fetch(`${root}cart.js`);
    if (!res.ok) throw new Error('Cart fetch failed');
    return res.json();
  }

  function updateCartBadge(count) {
    document.querySelectorAll('.cart-count-badge').forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
    const drawerCount = document.getElementById('cart-drawer-count');
    if (drawerCount) drawerCount.textContent = `(${count})`;
  }

  async function refreshCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('section_id', 'cart-drawer');
      const res = await fetch(url.toString());
      if (!res.ok) return;

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newDrawer = doc.getElementById('cart-drawer');
      if (!newDrawer) return;

      const targets = [
        ['cart-drawer-items', 'cart-drawer-items'],
        ['cart-drawer-footer', 'cart-drawer-footer'],
        ['cart-drawer-shipping', 'cart-drawer-shipping'],
      ];

      targets.forEach(([id]) => {
        const current = document.getElementById(id);
        const next = newDrawer.querySelector(`#${id}`);
        if (current && next) {
          current.innerHTML = next.innerHTML;
          current.className = next.className;
          if (next.hasAttribute('aria-hidden')) {
            current.setAttribute('aria-hidden', next.getAttribute('aria-hidden'));
          } else {
            current.removeAttribute('aria-hidden');
          }
        }
      });

      const newCount = newDrawer.querySelector('#cart-drawer-count');
      const currentCount = document.getElementById('cart-drawer-count');
      if (newCount && currentCount) {
        currentCount.textContent = newCount.textContent;
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

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.description || data.message || LABELS.error);
    }

    const cart = await fetchCart();
    updateCartBadge(cart.item_count);
    openCartDrawerUI();
    await refreshCartDrawer();
    return data;
  }

  function openCartDrawerUI() {
    window.dispatchEvent(new CustomEvent('open-cart'));
    document.getElementById('cart-drawer')?.classList.add('is-open');
  }

  function resolveAddButton(form, submitter) {
    if (submitter && (submitter.name === 'add' || submitter.dataset?.addBtn !== undefined || submitter.hasAttribute('data-add-btn'))) {
      return submitter;
    }
    if (form.id === 'product-form') {
      return document.getElementById('product-add-btn');
    }
    return form.querySelector('[data-add-btn]') || form.querySelector('button[type="submit"]');
  }

  function getBtnLabelEl(btn) {
    if (!btn) return null;
    return btn.querySelector('[data-add-btn-label]') || btn;
  }

  function setBtnState(btn, state, originalLabel) {
    if (!btn) return;
    const labelEl = getBtnLabelEl(btn);
    btn.classList.remove('is-added', 'is-error');

    if (state === 'loading') {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      if (labelEl) labelEl.textContent = LABELS.adding;
      return;
    }

    btn.removeAttribute('aria-busy');

    if (state === 'success') {
      btn.classList.add('is-added');
      if (labelEl) labelEl.textContent = LABELS.added;
      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('is-added');
        if (labelEl) labelEl.textContent = originalLabel || LABELS.add;
      }, 1400);
      return;
    }

    if (state === 'error') {
      btn.classList.add('is-error');
      if (labelEl) labelEl.textContent = LABELS.error;
      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('is-error');
        if (labelEl) labelEl.textContent = originalLabel || LABELS.add;
      }, 2000);
      return;
    }

    btn.disabled = false;
    if (labelEl) labelEl.textContent = originalLabel || LABELS.add;
  }

  function isAddToCartForm(form) {
    if (!form || form.tagName !== 'FORM') return false;
    if (form.classList.contains('ajax-cart-quick')) return true;
    return form.id === 'product-form' && form.classList.contains('ajax-cart');
  }

  async function handleAddToCartSubmit(e) {
    const form = e.target;
    if (!isAddToCartForm(form)) return;
    if (form.id === 'product-form' && e.submitter?.name === 'checkout') return;

    e.preventDefault();
    e.stopPropagation();

    if (form.dataset.busy === 'true') return;
    form.dataset.busy = 'true';

    const btn = resolveAddButton(form, e.submitter);

    if (btn?.disabled) {
      form.dataset.busy = 'false';
      return;
    }

    const labelEl = getBtnLabelEl(btn);
    const originalLabel = labelEl?.textContent?.trim() || LABELS.add;
    setBtnState(btn, 'loading', originalLabel);

    try {
      const fd = new FormData(form);
      if (!fd.get('id')) {
        throw new Error('Variante no disponible');
      }
      await addToCart(fd);
      setBtnState(btn, 'success', originalLabel);
    } catch (err) {
      console.warn('[NANOTRONICS] add to cart', err);
      setBtnState(btn, 'error', originalLabel);
    } finally {
      form.dataset.busy = 'false';
    }
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
    if (!variantSelect || !product.variants?.length) return;

    const hasVariantPicker = form.querySelector('.variant-option-input');
    if (!hasVariantPicker) return;

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
    const addLabelDefault = addLabel?.textContent?.trim() || LABELS.add;
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

    document.addEventListener('submit', handleAddToCartSubmit, true);

    window.addEventListener('open-cart', () => {
      document.getElementById('cart-drawer')?.classList.add('is-open');
    });

    window.addEventListener('close-cart', () => {
      document.getElementById('cart-drawer')?.classList.remove('is-open');
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
