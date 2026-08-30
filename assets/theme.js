/**
 * NANOTRONICS theme — cart drawer, AJAX add to cart, variant picker
 */
(function () {
  const routes = window.Shopify?.routes || { root: '/' };
  const root = routes.root?.endsWith('/') ? routes.root : `${routes.root || '/'}/`;

  const L = window.theme?.labels || {};
  const LABELS = {
    add: L.add || 'Agregar al carrito',
    adding: L.adding || 'Agregando...',
    added: L.added || 'Agregado al carrito',
    error: L.error || 'No se pudo agregar',
    selectVariant: L.selectVariant || 'Selecciona una variante',
    soldOut: L.soldOut || 'Agotado',
    stockIn: L.stockIn || 'En stock',
    stockOut: L.stockOut || 'Agotado por ahora',
    cartError: L.cartError || 'No se pudo actualizar el carrito',
  };

  const busyForms = new WeakSet();

  function getRoot() {
    const r = window.Shopify?.routes?.root || '/';
    return r.endsWith('/') ? r : `${r}/`;
  }

  async function fetchCart() {
    const res = await fetch(`${getRoot()}cart.js`, { credentials: 'same-origin' });
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

  function showToast(message, type) {
    let toast = document.getElementById('nt-cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nt-cart-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `nt-cart-toast nt-cart-toast--${type || 'info'} is-visible`;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  function openCartDrawerUI() {
    window.dispatchEvent(new CustomEvent('open-cart', { bubbles: true }));
    document.body?.dispatchEvent(new CustomEvent('open-cart', { bubbles: true }));
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
    }
  }

  async function refreshCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('section_id', 'cart-drawer');
      const res = await fetch(url.toString(), { credentials: 'same-origin' });
      if (!res.ok) return;

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newDrawer = doc.getElementById('cart-drawer');
      if (!newDrawer) return;

      ['cart-drawer-items', 'cart-drawer-footer', 'cart-drawer-shipping'].forEach((id) => {
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
      if (newCount && currentCount) currentCount.textContent = newCount.textContent;
    } catch (e) {
      console.warn('[NANOTRONICS] cart refresh', e);
    }
  }

  function readVariantId(form, btn) {
    const fromBtn = btn?.dataset?.variantId || btn?.getAttribute?.('data-variant-id');
    if (fromBtn) return fromBtn;

    const idField = form?.querySelector('[name="id"]');
    if (idField?.value) return idField.value;

    return null;
  }

  function readQuantity(form, btn) {
    const fromBtn = parseInt(btn?.dataset?.quantity, 10);
    if (Number.isFinite(fromBtn) && fromBtn > 0) return fromBtn;

    const qtyField = form?.querySelector('[name="quantity"]');
    const qty = parseInt(qtyField?.value, 10);
    return Number.isFinite(qty) && qty > 0 ? qty : 1;
  }

  async function addVariantToCart(variantId, quantity) {
    const res = await fetch(`${getRoot()}cart/add.js`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        id: Number(variantId),
        quantity: Number(quantity) || 1,
      }),
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
      }, 1600);
      return;
    }

    if (state === 'error') {
      btn.classList.add('is-error');
      if (labelEl) labelEl.textContent = LABELS.error;
      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('is-error');
        if (labelEl) labelEl.textContent = originalLabel || LABELS.add;
      }, 2200);
      return;
    }

    btn.disabled = false;
    if (labelEl) labelEl.textContent = originalLabel || LABELS.add;
  }

  function isAddForm(form) {
    if (!form || form.tagName !== 'FORM') return false;
    if (form.classList.contains('ajax-cart-quick')) return true;
    return form.id === 'product-form' && form.classList.contains('ajax-cart');
  }

  function isAddButton(btn) {
    if (!btn?.hasAttribute?.('data-add-btn')) return false;
    const form = resolveForm(btn);
    return isAddForm(form) || Boolean(readVariantId(form, btn));
  }

  function getBusyKey(form, btn) {
    return form || btn;
  }

  async function handleAdd(form, btn) {
    const busyKey = getBusyKey(form, btn);
    if (busyForms.has(busyKey)) return;

    const variantId = readVariantId(form, btn);
    if (!variantId) {
      showToast(LABELS.selectVariant, 'error');
      return;
    }

    busyForms.add(busyKey);
    const labelEl = btn ? getBtnLabelEl(btn) : null;
    const originalLabel = labelEl?.textContent?.trim() || LABELS.add;
    if (btn) setBtnState(btn, 'loading', originalLabel);

    try {
      await addVariantToCart(variantId, readQuantity(form, btn));
      if (btn) setBtnState(btn, 'success', originalLabel);
      showToast(LABELS.added, 'success');
    } catch (err) {
      console.warn('[NANOTRONICS] add to cart', err);
      if (btn) setBtnState(btn, 'error', originalLabel);
      showToast(err.message || LABELS.error, 'error');
    } finally {
      busyForms.delete(busyKey);
    }
  }

  function resolveForm(btn) {
    if (!btn) return null;
    if (btn.form) return btn.form;
    const formId = btn.getAttribute('form');
    if (formId) {
      const linked = document.getElementById(formId);
      if (linked?.tagName === 'FORM') return linked;
    }
    return btn.closest('form');
  }

  function onAddButtonClick(e) {
    const btn = e.target.closest('[data-add-btn]');
    if (!btn || btn.disabled || !isAddButton(btn)) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    handleAdd(resolveForm(btn), btn);
  }

  function onAddFormSubmit(e) {
    const form = e.target;
    if (!isAddForm(form)) return;

    const submitter = e.submitter;
    if (form.id === 'product-form' && submitter?.name === 'checkout') return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const btn =
      submitter ||
      form.querySelector('[data-add-btn]') ||
      document.getElementById('product-add-btn');

    handleAdd(form, btn);
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
    if (!form.querySelector('.variant-option-input')) return;

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
    const stickyAddBtn = document.querySelector('.nt-sticky-bar [data-add-btn]');

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
      if (addLabel) addLabel.textContent = available ? addLabelDefault : LABELS.soldOut;

      const stockStatus = document.getElementById('product-stock-status');
      const stockDot = document.getElementById('product-stock-dot');
      const stockText = document.getElementById('product-stock-text');
      if (stockStatus && stockText && stockDot) {
        stockStatus.classList.toggle('text-success', available);
        stockStatus.classList.toggle('text-danger', !available);
        stockDot.classList.toggle('bg-success', available);
        stockDot.classList.toggle('bg-danger', !available);
        stockText.textContent = available ? LABELS.stockIn : LABELS.stockOut;
      }
    }

    function updateUI(variant) {
      if (!variant) {
        setAvailabilityUI(false);
        return;
      }

      variantSelect.value = String(variant.id);
      if (addBtn) addBtn.dataset.variantId = String(variant.id);
      if (stickyAddBtn) stickyAddBtn.dataset.variantId = String(variant.id);

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

  let drawerLastFocus = null;
  let drawerTrap = null;

  function drawerFocusables(drawer) {
    return Array.from(
      drawer.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.getClientRects().length > 0);
  }

  function lockDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer || drawerTrap) return;
    drawerLastFocus = document.activeElement;
    document.body.classList.add('nt-scroll-locked');
    const closeBtn = drawer.querySelector('.nt-drawer__panel button');
    (closeBtn || drawerFocusables(drawer)[0])?.focus({ preventScroll: true });
    drawerTrap = (e) => {
      if (e.key !== 'Tab') return;
      const items = drawerFocusables(drawer);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', drawerTrap);
  }

  function unlockDrawer() {
    document.body.classList.remove('nt-scroll-locked');
    if (drawerTrap) document.removeEventListener('keydown', drawerTrap);
    drawerTrap = null;
    if (drawerLastFocus && document.contains(drawerLastFocus)) {
      drawerLastFocus.focus({ preventScroll: true });
    }
    drawerLastFocus = null;
  }

  function boot() {
    document.documentElement.classList.add('js-ready');
    initProductVariants();

    window.addEventListener('open-cart', () => {
      document.getElementById('cart-drawer')?.classList.add('is-open');
      lockDrawer();
    });

    window.addEventListener('close-cart', () => {
      const drawer = document.getElementById('cart-drawer');
      if (drawer) {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
      }
      unlockDrawer();
    });
  }

  document.addEventListener('click', onAddButtonClick, true);
  document.addEventListener('submit', onAddFormSubmit, true);

  async function changeCartLine(key, quantity) {
    if (!key || Number.isNaN(quantity) || quantity < 0) return false;
    try {
      const res = await fetch(`${getRoot()}cart/change.js`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity }),
      });
      if (!res.ok) throw new Error('Cart change failed');
      const cart = await res.json();
      updateCartBadge(cart.item_count || 0);
      const onCartPage = window.location.pathname.includes('/cart');
      if (onCartPage) {
        window.location.reload();
        return true;
      }
      await refreshCartDrawer();
      const drawer = document.getElementById('cart-drawer');
      if (!drawer?.classList.contains('is-open')) openCartDrawerUI();
      return true;
    } catch (err) {
      console.warn('[NANOTRONICS] cart change', err);
      showToast(LABELS.cartError, 'error');
      return false;
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.cart-increment, .cart-decrement, .cart-remove');
    if (!btn) return;
    e.preventDefault();
    const key = btn.dataset.lineKey;
    const qty = parseInt(btn.dataset.quantity, 10);
    changeCartLine(key, qty);
  });

  document.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('cart-qty-input')) return;
    const key = e.target.dataset.lineKey;
    const qty = parseInt(e.target.value, 10);
    const ok = await changeCartLine(key, qty);
    if (!ok) e.target.value = e.target.defaultValue;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
