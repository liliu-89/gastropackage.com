// ----- Consent helpers -----
function consentModeFromPrefs(prefs){
  const stats = !!prefs.statistics;
  const marketing = !!prefs.marketing;
  return {
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
    analytics_storage: stats ? 'granted' : 'denied'
  };
}

function applyConsent(prefs, source){
  // 1) Consent Mode aktualisieren
  const cm = consentModeFromPrefs(prefs);
  if (typeof gtag === 'function'){
    gtag('consent', 'update', cm);
  }

  // 2) Events für GTM
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'consent_update',
    consent_categories: {
      essential: true,
      statistics: !!prefs.statistics,
      marketing: !!prefs.marketing
    },
    consent_mode: cm,
    consent_source: source || 'unknown'
  });

  // Komfort-Events
  window.dataLayer.push({ event: 'consent_statistics_' + (prefs.statistics ? 'granted' : 'denied') });
  window.dataLayer.push({ event: 'consent_marketing_' + (prefs.marketing ? 'granted' : 'denied') });

  // 3) Persistenz
  try {
    localStorage.setItem('gp_consent_prefs', JSON.stringify(prefs));
    localStorage.setItem('gp_consent_set', 'true');
  } catch(e) {}
}

// Beim Laden: gespeicherte Präferenzen (Default ist denied aus dem Head)
(function restoreConsentOnLoad(){
  try{
    const hasSet = localStorage.getItem('gp_consent_set') === 'true';
    if(hasSet){
      const prefs = JSON.parse(localStorage.getItem('gp_consent_prefs') || '{}');
      applyConsent({ statistics: !!prefs.statistics, marketing: !!prefs.marketing }, 'restore');
      window.dataLayer.push({ event: 'consent_restored' });
    }
  }catch(e){}
})();

// ----- UI wiring -----
(function initConsentBanner(){
  const banner = document.getElementById('consent-banner');
  if(!banner) return;

  const tStats = document.getElementById('toggle-statistics');
  const tMark  = document.getElementById('toggle-marketing');
  const btnAcceptAll = document.getElementById('btn-accept-all');
  const btnAcceptSel = document.getElementById('btn-accept-selection');
  const btnDeclineAll = document.getElementById('btn-decline-all');

  function initUIFromStorage(){
    try{
      const hasSet = localStorage.getItem('gp_consent_set') === 'true';
      if(hasSet){
        const prefs = JSON.parse(localStorage.getItem('gp_consent_prefs') || '{}');
        tStats.checked = !!prefs.statistics;
        tMark.checked  = !!prefs.marketing;
        banner.style.display = 'none';
      } else {
        tStats.checked = false;
        tMark.checked  = false;
        banner.style.display = 'block';
      }
    }catch(e){
      tStats.checked = false;
      tMark.checked  = false;
      banner.style.display = 'block';
    }
  }

  // Buttons
  btnAcceptAll.addEventListener('click', function(){
    tStats.checked = true;
    tMark.checked  = true;
    applyConsent({ statistics: true, marketing: true }, 'accept_all');
    banner.style.display = 'none';
  });

  btnAcceptSel.addEventListener('click', function(){
    const prefs = { statistics: tStats.checked, marketing: tMark.checked };
    applyConsent(prefs, 'accept_selection');
    banner.style.display = 'none';
  });

  btnDeclineAll.addEventListener('click', function(){
    tStats.checked = false;
    tMark.checked  = false;
    applyConsent({ statistics: false, marketing: false }, 'decline_all');
    banner.style.display = 'none';
  });

  // Optional: live toggle no-op
  tStats.addEventListener('change', function(){ /* UI only */ });
  tMark.addEventListener('change', function(){ /* UI only */ });

  // Globale Funktion für Footer-Link/Button
  window.openConsentBanner = function(){
    try{
      const prefs = JSON.parse(localStorage.getItem('gp_consent_prefs') || '{}');
      tStats.checked = !!prefs.statistics;
      tMark.checked  = !!prefs.marketing;
    }catch(e){}
    banner.style.display = 'block';
  };

  initUIFromStorage();
})();