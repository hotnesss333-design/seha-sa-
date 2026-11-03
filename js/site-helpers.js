
      (function() {
        window._userway_config = {
          account: "2w89zcJOTG",
          position: 3,
          size: "small"
        };
        try {
          localStorage.setItem('userway-positionWidget', '3');
          localStorage.setItem('userway-positionWidgetMobile', '3');
        } catch(e) {}

        function lockWidgetPosition() {
          var els = document.querySelectorAll('#userwayAccessibilityIcon, .uai, .userway_buttons_wrapper, [id*="userwayAccessibilityIcon"], [id*="userwayLstIcon"]');
          for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.style.left !== '10px' || el.style.right !== 'auto') {
              el.style.setProperty('left', '10px', 'important');
              el.style.setProperty('right', 'auto', 'important');
              el.style.setProperty('bottom', '12px', 'important');
              el.style.setProperty('position', 'fixed', 'important');
            }
          }
        }
        setInterval(lockWidgetPosition, 250);
        document.addEventListener('DOMContentLoaded', lockWidgetPosition);

        // WhatsApp link interceptor to ensure direct chat opening
        document.addEventListener('click', function(e) {
          var a = e.target.closest('a');
          if (a && a.href && a.href.includes('wa.me')) {
            a.href = 'https://wa.me/+966920002005';
            return;
          }
          // If clicked the whatsapp icon next to the link
          var detailParent = e.target && e.target.closest ? e.target.closest('.details, .detail') : null;
          var detailText = detailParent ? (detailParent.innerText || detailParent.textContent || '') : '';
          if (e.target && (e.target.alt === 'whatsapp' || (detailParent && detailText.includes('920002005') && (e.target.tagName === 'IMG' || e.target.tagName === 'svg' || e.target.tagName === 'path')))) {
            if (detailParent && detailParent.querySelector('img[alt="whatsapp"], svg')) {
              window.open('https://wa.me/+966920002005', '_blank');
              e.preventDefault();
            }
          }
        }, true);
      })();
    

      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
      window.getFmsUserInfo = window.getFmsUserInfo || function() { return null; };
      window.checkSurveyEligibility = window.checkSurveyEligibility || function() { return false; };
      window.addEventListener('error', function(e) {
        console.warn('Page runtime issue logged:', e.message);
      });
    