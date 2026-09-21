/* ===========================================================================
   RECY'STEM-PRO · comportements de la maquette
   Aucune dépendance. Tout est dégradable : sans JS, les pages restent lisibles
   et le téléphone reste cliquable.
   =========================================================================== */
(function () {
  'use strict';

  /* --- stockage tolérant (navigation privée, cookies bloqués) ------------- */
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* sans effet */ } }
  };

  /* --- thème clair / sombre ---------------------------------------------- */
  var root = document.documentElement;
  var saved = store.get('rsp-theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  function currentTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr) return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function paintThemeBtn(btn) {
    var dark = currentTheme() === 'dark';
    var label = btn.querySelector('span');
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('title', dark ? 'Passer en thème clair' : 'Passer en thème sombre');
    if (label) label.textContent = dark ? ' Clair' : ' Sombre';
  }
  var themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) {
    paintThemeBtn(themeBtn);
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('rsp-theme', next);
      paintThemeBtn(themeBtn);
    });
  }

  /* --- année dynamique en pied de page ----------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* --- petit avertisseur -------------------------------------------------- */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.setAttribute('data-show', '1');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.removeAttribute('data-show'); }, 5200);
  }

  /* --- sélecteur de langue ------------------------------------------------
     La structure i18n est en place (hreflang, chemins /en/, attribut lang).
     Le contenu anglais est un livrable de rédaction : on le dit, on ne le
     simule pas.                                                            */
  Array.prototype.forEach.call(document.querySelectorAll('.lang button'), function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-current') === 'true') return;
      say('Version ' + btn.dataset.lang.toUpperCase() + ' : arborescence /' +
          btn.dataset.lang + '/ et balises hreflang déjà en place dans la maquette. ' +
          'La traduction est un livrable de rédaction, chiffré à part.');
    });
  });

  /* --- bandeau de maquette ------------------------------------------------ */
  var mockbar = document.getElementById('mockbar');
  if (mockbar) {
    var close = mockbar.querySelector('button');
    if (close) close.addEventListener('click', function () { mockbar.hidden = true; });
  }

  /* --- formulaire de contact (stub honnête) ------------------------------ */
  Array.prototype.forEach.call(document.querySelectorAll('form[data-stub]'), function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = form.querySelector('.form-msg');
      if (!msg) return;
      msg.hidden = false;
      msg.textContent = 'Maquette : le formulaire n’est pas encore relié à une boîte. ' +
        'En production, ce message part sur contact@recystempro.com avec accusé de réception automatique.';
      msg.setAttribute('role', 'status');
    });
  });

  /* =======================================================================
     Auto-diagnostic « Suis-je concerné ? »
     ======================================================================= */

  var FIL = {
    eee: { code: 'DEEE', nom: 'Équipements électriques et électroniques', org: 'ecosystem, Ecologic', menager: true },
    pa:  { code: 'PA',   nom: 'Piles et accumulateurs', org: 'Corepile, Screlec', menager: true },
    emb: { code: 'EMB',  nom: 'Emballages ménagers', org: 'Citeo, Adelphe', menager: true },
    tlc: { code: 'TLC',  nom: 'Textiles, linge de maison, chaussures', org: 'Refashion', menager: true },
    dea: { code: 'DEA',  nom: 'Éléments d’ameublement', org: 'Ecomaison, Valdelia', menager: true },
    pnu: { code: 'PNU',  nom: 'Pneumatiques', org: 'Aliapur, GIE FRP', menager: false },
    pap: { code: 'PAP',  nom: 'Papiers graphiques', org: 'Citeo', menager: true },
    jou: { code: 'JOU',  nom: 'Jouets', org: 'éco-organisme agréé de la filière', menager: true },
    asl: { code: 'ASL',  nom: 'Articles de sport et de loisirs', org: 'éco-organisme agréé de la filière', menager: true },
    bj:  { code: 'BJ',   nom: 'Articles de bricolage et de jardin', org: 'éco-organisme agréé de la filière', menager: true }
  };

  var form = document.getElementById('diag');
  if (!form) return;

  var panels = Array.prototype.slice.call(form.querySelectorAll('.step-panel'));
  var progress = Array.prototype.slice.call(document.querySelectorAll('#prog li'));
  var btnPrev = document.getElementById('d-prev');
  var btnNext = document.getElementById('d-next');
  var counter = document.getElementById('d-count');
  var errBox = document.getElementById('d-err');
  var result = document.getElementById('d-result');
  var stepLabel = document.getElementById('d-step-label');
  var at = 0;

  /* pré-remplissage depuis l'amorce de la page d'accueil (?produit=eee) */
  try {
    var q = new URLSearchParams(window.location.search).get('produit');
    if (q && FIL[q]) {
      var pre = form.querySelector('input[name="produit"][value="' + q + '"]');
      if (pre) pre.checked = true;
    }
  } catch (e) { /* URLSearchParams absent : sans effet */ }

  function paint() {
    panels.forEach(function (p, i) { p.hidden = i !== at; });
    progress.forEach(function (li, i) {
      li.setAttribute('data-state', i < at ? 'done' : (i === at ? 'current' : 'todo'));
    });
    btnPrev.disabled = at === 0;
    btnNext.textContent = at === panels.length - 1 ? 'Afficher mes obligations' : 'Continuer';
    counter.textContent = 'Question ' + (at + 1) + ' sur ' + panels.length;
    if (stepLabel) stepLabel.textContent = 'Étape ' + (at + 1) + '/' + panels.length;
    errBox.removeAttribute('data-show');
  }

  function valid() {
    var panel = panels[at];
    var inputs = panel.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) if (inputs[i].checked) return true;
    return false;
  }

  btnNext.addEventListener('click', function () {
    if (!valid()) {
      errBox.setAttribute('data-show', '1');
      errBox.textContent = at === 0
        ? 'Sélectionnez au moins une catégorie de produit pour continuer.'
        : 'Sélectionnez une réponse pour continuer.';
      var first = panels[at].querySelector('input');
      if (first) first.focus();
      return;
    }
    if (at < panels.length - 1) {
      at += 1;
      paint();
      var h = panels[at].querySelector('.q');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
    } else {
      render();
    }
  });

  btnPrev.addEventListener('click', function () {
    if (at === 0) return;
    at -= 1;
    if (result) result.hidden = true;
    paint();
    var h = panels[at].querySelector('.q');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  });

  /* Entrée = continuer, jamais un envoi silencieux */
  form.addEventListener('submit', function (ev) { ev.preventDefault(); btnNext.click(); });

  function checked(name) {
    return Array.prototype.map.call(
      form.querySelectorAll('input[name="' + name + '"]:checked'),
      function (i) { return i.value; }
    );
  }

  function li(titre, texte, source) {
    return '<li>' +
      '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M2 8.6 6 12.4 14 3.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>' +
      '<div><b>' + titre + '</b><p>' + texte + '</p>' +
      (source ? '<span class="src">' + source + '</span>' : '') +
      '</div></li>';
  }

  function render() {
    var produits = checked('produit');
    var pays = checked('pays')[0];
    var canal = checked('canal')[0];
    var volume = checked('volume')[0];

    var obligations = [];
    var menager = produits.some(function (p) { return FIL[p] && FIL[p].menager; });

    /* 1. Le socle, filière par filière */
    var codes = produits.map(function (p) { return FIL[p].code; }).join(', ');
    obligations.push(li(
      'Un identifiant unique (UIN) par filière',
      'Vous relevez de ' + produits.length + ' filière' + (produits.length > 1 ? 's' : '') +
      ' : ' + produits.map(function (p) { return FIL[p].nom; }).join(' · ') +
      '. Chacune donne lieu à un identifiant distinct, délivré par l’ADEME et à faire figurer sur vos documents de vente.',
      'Code env. art. L541-10-13 · registre SYDEREP / ADEME'
    ));

    obligations.push(li(
      'Adhésion à un éco-organisme, ou système individuel',
      'Filières concernées : ' + codes + '. Éco-organismes agréés à contacter : ' +
      produits.map(function (p) { return FIL[p].org; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' · ') + '.',
      'Code env. art. L541-10'
    ));

    obligations.push(li(
      'Déclaration annuelle des mises sur le marché',
      'Quantités déclarées par catégorie et par unité (poids ou pièce) pour l’année écoulée, puis versement de l’éco-contribution correspondante au barème de l’éco-organisme.',
      'Déclaration sur le portail SYDEREP'
    ));

    /* 2. Établissement */
    if (pays === 'hors-ue') {
      obligations.push(li(
        'Mandataire établi en France, obligatoire',
        'Votre société n’étant pas établie dans l’Union, vous ne pouvez pas vous enregistrer directement : la réglementation exige la désignation d’un mandataire établi en France, qui reprend vos obligations en son nom pour votre compte. C’est exactement notre métier.',
        'Code env. art. L541-10' + (produits.indexOf('eee') > -1 ? ' · art. 17 de la directive 2012/19/UE (DEEE)' : '')
      ));
    } else if (pays === 'ue') {
      obligations.push(li(
        'Enregistrement direct ou mandataire',
        'Établi dans un autre État membre, vous pouvez vous enregistrer vous-même en France, ou désigner un mandataire. En pratique, la déclaration se fait en français, les barèmes diffèrent d’un éco-organisme à l’autre, et le mandat évite d’avoir à suivre les évolutions réglementaires nationales.',
        'Directive DEEE 2012/19/UE, art. 17 · vente à distance'
      ));
    } else {
      obligations.push(li(
        'Enregistrement direct au titre du producteur',
        'Établi en France, vous vous enregistrez directement. Le point d’attention porte sur le périmètre : la qualité de producteur s’apprécie produit par produit, y compris pour les marchandises importées que vous revendez sous votre marque.',
        'Code env. art. L541-10-1'
      ));
    }

    /* 3. Canal de vente */
    if (canal === 'marketplace') {
      obligations.push(li(
        'Votre place de marché va vous demander votre UIN',
        'Les places de marché ont l’obligation de vérifier que leurs vendeurs sont enregistrés, et de se substituer à eux à défaut. Sans identifiant, le déréférencement des annonces est le scénario le plus fréquent, souvent sans préavis utile.',
        'Code env. art. L541-10-9'
      ));
    }
    if (canal === 'directe' || canal === 'marketplace') {
      if (menager) {
        obligations.push(li(
          'Signalétique de tri (Triman) et information du consommateur',
          'Apposition du logo Triman et de l’information sur les modalités de tri, sur le produit, son emballage ou, à défaut, en dématérialisé.',
          'Loi AGEC art. 17 · décret n° 2021-835'
        ));
      }
    }
    if (canal === 'b2b') {
      obligations.push(li(
        'Vente professionnelle : filières et barèmes distincts',
        'Les équipements professionnels relèvent de catégories et d’éco-organismes différents de ceux du grand public. C’est la source d’erreur de déclaration la plus courante que nous rencontrons.',
        'Annexe I de la directive 2012/19/UE · catégories professionnelles'
      ));
    }

    /* 4. Volume */
    if (volume === 'gros') {
      obligations.push(li(
        'Système individuel : à étudier sérieusement',
        'Au-delà d’un certain volume, la mise en place d’un système individuel approuvé devient économiquement pertinente face à l’éco-contribution versée à un éco-organisme. Cela suppose un dossier d’approbation et des garanties financières. C’est l’une de nos quatre prestations.',
        'Code env. art. L541-10, II · système individuel approuvé'
      ));
    } else if (volume === 'inconnu') {
      obligations.push(li(
        'Reconstitution de l’historique des mises sur le marché',
        'Sans volumes consolidés, la première étape est l’audit : reconstitution des quantités par filière sur les exercices concernés, y compris antérieurs, afin de calibrer les déclarations de régularisation.',
        'Première étape de notre audit réglementaire'
      ));
    }

    /* 5. Le risque, une seule fois, sans dramatisation */
    obligations.push(li(
      'À défaut : sanction administrative',
      'Le non-respect des obligations d’enregistrement et de déclaration est passible d’une amende administrative, prononcée par filière et par manquement.',
      'Code env. art. L541-9-4 · montants à vérifier au cas par cas'
    ));

    /* prestations conseillées */
    var presta = [];
    if (pays === 'hors-ue' || pays === 'ue') presta.push('Mandataire européen');
    presta.push('Mise en conformité réglementaire');
    if (volume === 'gros') presta.push('Systèmes individuels');
    if (volume === 'inconnu' || canal === 'b2b') presta.push('Conseil et études');

    var tags = produits.map(function (p) {
      return '<span class="tag">' + FIL[p].code + '</span>';
    }).join('');

    result.innerHTML =
      '<div class="result__hd">' +
      '<h3>' + (pays === 'hors-ue'
        ? 'Oui, et vous avez besoin d’un mandataire en France'
        : 'Oui, vous êtes concerné' + (produits.length > 1 ? ' par plusieurs filières' : '')) + '</h3>' +
      '<p>Récapitulatif établi à partir de vos quatre réponses. Il ne remplace pas un audit, mais il vous donne le périmètre exact à traiter.</p>' +
      '</div>' +
      '<div class="result__body">' +
      '<h4>Filières identifiées</h4>' +
      '<div class="tag-row">' + tags + '</div>' +
      '<h4>Vos obligations</h4>' +
      '<ul class="oblig">' + obligations.join('') + '</ul>' +
      '<h4>Prestations correspondantes</h4>' +
      '<div class="tag-row">' + presta.map(function (p) { return '<span class="tag">' + p + '</span>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="result__cta">' +
      '<a class="btn" href="tel:+33143202138">Parler à un expert&nbsp;: 01 43 20 21 38</a>' +
      '<button type="button" class="btn btn--ghost" data-print>Imprimer ce récapitulatif</button>' +
      '<p>Réponse le jour même, du lundi au vendredi.</p>' +
      '</div>';

    result.hidden = false;
    result.setAttribute('tabindex', '-1');
    result.focus();
    var pr = result.querySelector('[data-print]');
    if (pr) pr.addEventListener('click', function () { window.print(); });
  }

  paint();
})();
