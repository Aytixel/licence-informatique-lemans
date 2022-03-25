const load_analytics = () => {
  const tag_manager_script = document.createElement("script");
  const web_vitals_script = document.createElement("script");

  tag_manager_script.src =
    "https://www.googletagmanager.com/gtag/js?id=G-B5EYVWF0Z9";
  tag_manager_script.setAttribute("async", "");
  tag_manager_script.onload = () => {
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      dataLayer.push(arguments);
    }

    gtag("js", new Date());
    gtag("config", "G-B5EYVWF0Z9");

    web_vitals_script.src =
      "https://unpkg.com/web-vitals/dist/web-vitals.iife.js";
    web_vitals_script.setAttribute("async", "");
    web_vitals_script.onload = function () {
      function sendToGoogleAnalytics({ name, delta, value, id }) {
        gtag("event", name, {
          value: delta,
          metric_id: id,
          metric_value: value,
          metric_delta: delta,
        });
      }

      webVitals.getCLS(sendToGoogleAnalytics);
      webVitals.getFID(sendToGoogleAnalytics);
      webVitals.getLCP(sendToGoogleAnalytics);
    };
  };

  document.head.appendChild(tag_manager_script);
  document.head.appendChild(web_vitals_script);
};

if (+Cookies.get("gg_analytics")) load_analytics();
