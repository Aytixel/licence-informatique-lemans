const search_params=new URLSearchParams(location.search);let level=search_params.get("level")||localStorage.getItem("history-level"),group=search_params.get("group")||localStorage.getItem("history-group");const study_level_list_element=document.getElementById("study-level"),place_list_element=document.getElementById("place"),room_list_element=document.getElementById("room"),menu_button_element=document.getElementById("menu-button"),menu_element=document.getElementById("menu"),update_free_room_list=async()=>{try{const e=await fetch("https://api.licence-informatique-lemans.tk/v2/find-free-room.json"),t=await e.json();if(!t?.error){const e=new Intl.DateTimeFormat("default",{timeStyle:"short",timeZone:"UTC"});for(const n in t){const a=document.createElement("summary"),l=document.createElement("details"),o=document.createElement("ul");a.textContent=planning_resources_name[n].name;for(const a of t[n]){const t=document.createElement("div");if(t.textContent=planning_resources_name[n].name_list[a.room],o.append(t),a.time_left){const t=document.createElement("div");t.textContent=`disponible encore : ${e.format(new Date(a.time_left))}`,t.classList.add("time-left"),o.append(t)}}l.append(a,o),room_list_element.append(l)}}}catch{}};menu_button_element.addEventListener("mousedown",(e=>e.preventDefault())),menu_button_element.addEventListener("touchdown",(e=>e.preventDefault())),menu_button_element.addEventListener("pointerup",(e=>{e.preventDefault(),menu_element.showModal(),update_free_room_list()})),menu_element.addEventListener("pointerup",(e=>{const t=menu_element.getBoundingClientRect();(e.clientX<t.left||e.clientX>t.right||e.clientY<t.top||e.clientY>t.bottom)&&(menu_element.close(),room_list_element.innerHTML="")}));const planning_element=document.getElementsByTagName("planning-viewer")[0],title_element=[...document.getElementsByTagName("h1"),...document.getElementsByTagName("h2")],in_favorites=()=>JSON.parse(localStorage.getItem("favorites")).some((e=>e.level==level&&e.group==group)),load_planning=debounce((e=>{planning_resources_name[e?.level]?.name_list[e?.group]?(planning_element.load(e),title_element[0].textContent=planning_resources_name[e?.level].name,title_element[1].textContent=planning_resources_name[e?.level]?.name_list[e?.group],document.title=`${planning_resources_name[e?.level].name} ${planning_resources_name[e?.level]?.name_list[e?.group]}`):planning_element.reset()}),150),add_empty_days=e=>{const t=new Date(e.end_date);let n=new Date(e.start_date);for(;compare_date(n,t);)e.days.findIndex((e=>!compare_date(e.date,n)))<0&&e.days.push({date:n.toISOString(),lessons:[]}),n=add_days(n,1);return e},merge_new_planning=(e,t)=>{compare_date(t.start_date,e.start_date)>0&&(e.start_date=t.start_date),compare_date(t.end_date,e.end_date)<0&&(e.end_date=t.end_date);for(const n of t.days){const t=e.days.findIndex((e=>!compare_date(e.date,n.date)));t>-1?e.days[t]=n:e.days.push(n)}e.days.sort(((e,t)=>-compare_date(e.date,t.date)))},fecth_planning=async(e,t,n,a)=>{try{const l=await fetch(`https://api.licence-informatique-lemans.tk/v2/planning.json?level=${e}&group=${t}&start=${n.toISOString()}&end=${a.toISOString()}`);return add_empty_days(await l.json())}catch{return null}},update_favorites_planning=async(e=!1)=>{const t=JSON.parse(localStorage.getItem("favorites")),n=await Promise.all(e?[fecth_planning(level,group,keep_only_date(add_days(new Date,-7)),keep_only_date(Date.now()+new Date(0).setMonth(4)))]:t.map((e=>fecth_planning(e.level,e.group,keep_only_date(add_days(new Date,-7)),keep_only_date(Date.now()+new Date(0).setMonth(4))))));for(const e of n)if(e){const t=`${e.level}:${e.group}`,n=JSON.parse(localStorage.getItem(t))||{days:[],...e};merge_new_planning(n,e),localStorage.setItem(t,JSON.stringify(n))}},update_planning=async(e=!1)=>{if("string"!=typeof level||"string"!=typeof group)return void update_favorites_planning();let t;if(in_favorites())await update_favorites_planning(e),t=JSON.parse(localStorage.getItem(`${level}:${group}`));else if(t=await fecth_planning(level,group,e?keep_only_date(add_days(new Date,-7)):planning_element.start_date,e?keep_only_date(add_days(new Date,7)):planning_element.end_date),!e){const e={...planning_element.data};merge_new_planning(e,t),t=e}load_planning(t),e&&update_favorites_planning()},fetch_favorite_planning=async(e,t)=>{localStorage.setItem(`${e}:${t}`,JSON.stringify(await fecth_planning(e,t,keep_only_date(add_days(new Date,-7)),keep_only_date(Date.now()+new Date(0).setMonth(4)))))},switch_planning=(e,t)=>{navigator.onLine||(title_element[0].textContent="Pas d'internet",title_element[1].textContent="rip... faut attendre"),level==e&&group==t||(level=e,group=t,localStorage.setItem("history-level",level),localStorage.setItem("history-group",group),history.pushState({level:level,group:group},"",location.origin+location.pathname+`?level=${level}&group=${group}`)),update_planning(!0)};window.addEventListener("load",(async()=>{await planning_resources_loaded;const e=e=>{const t=document.createElement("summary"),n=document.createElement("details"),a=document.createElement("ul");t.textContent=planning_resources_name[e].name;for(const t in planning_resources_name[e].name_list){const n=document.createElement("planning-button");n.init(e,t,switch_planning,fetch_favorite_planning),a.append(n)}return n.append(t,a),n};for(const t of planning_resources_type["study-level"])study_level_list_element.append(e(t));for(const t of planning_resources_type.place)place_list_element.append(e(t));if(planning_element.addEventListener("planningfetch",(async e=>{const t={...planning_element.data};let n;e.request>0?(n=await fecth_planning(level,group,planning_element.end_date,keep_only_date(add_days(planning_element.end_date,7))),merge_new_planning(t,n)):(n=await fecth_planning(level,group,keep_only_date(add_days(planning_element.start_date,-7)),planning_element.start_date),merge_new_planning(t,n)),in_favorites()&&localStorage.setItem(`${level}:${group}`,JSON.stringify(t)),load_planning(t)})),"string"==typeof level&&"string"==typeof group?switch_planning(level,group):update_planning(),setInterval(update_planning,36e5),window.addEventListener("popstate",(e=>{e.state&&switch_planning(e.state.level,e.state.group)})),"serviceWorker"in navigator)try{const e=await navigator.serviceWorker.register("/sw.js");e.installing||e.waiting||e.active}catch(e){}}));
