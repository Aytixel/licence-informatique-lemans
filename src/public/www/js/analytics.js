const load_analytics = () => {
  const tag_manager_script = document.createElement("script");
  const analytics_script = document.createElement("script");

  tag_manager_script.src =
    "https://www.googletagmanager.com/gtag/js?id=G-B5EYVWF0Z9";
  tag_manager_script.setAttribute("async", "");
  analytics_script.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-B5EYVWF0Z9');
    `;

  document.head.appendChild(tag_manager_script);
  document.head.appendChild(analytics_script);
};

if (+Cookies.get("gg_analytics")) load_analytics();
