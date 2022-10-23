class PlanningFetchEvent extends Event{constructor(t){super("planningfetch"),this.request=t}}class PlanningViewer extends HTMLElement{data;__days_element={};start_date;end_date;__left_bar=document.createElement("div");__container=document.createElement("div");__right_bar=document.createElement("div");__first_load=!0;__scroll_left;__scroll_width;__client_width;__intersection_observer=new IntersectionObserver((t=>{for(const e of t)e.isIntersecting&&Math.sign(e.boundingClientRect.x)&&this.dispatchEvent(new PlanningFetchEvent(Math.sign(e.boundingClientRect.x)))}),{threshold:.1});constructor(){super(),this.attachShadow({mode:"open"});const t=document.createElement("style");t.textContent="\n    * {\n      position: relative;\n      z-index: 0;\n      margin: 0;\n      padding: 0;\n    }\n    \n    :host {\n      display: flex;\n\n      height: 100%;\n\n      white-space: nowrap;\n    }\n\n    .container {\n      height: 100%;\n      width: 100%;\n    }\n\n    .left-bar, .right-bar {\n      position: absolute;\n      top: 50%;\n      z-index: 1;\n\n      height: 20%;\n      width: 0.2em;\n\n      opacity: 0.5;\n\n      border-radius: 0.2em;\n\n      translate: 0.2em -50%;\n\n      background-color: var(--color-dark-0);\n\n      transition: 0.3s ease-in-out opacity;\n    }\n\n    .right-bar {\n      right: 0;\n\n      translate: -0.2em -50%;\n    }\n    ",this.__left_bar.classList.add("left-bar"),this.__right_bar.classList.add("right-bar");const e=document.createElement("slot");this.__container.classList.add("container"),this.__container.append(e),this.shadowRoot.append(t,this.__left_bar,this.__container,this.__right_bar),this.__scroll_left=this.__container.scrollLeft,this.__scroll_width=this.__container.scrollWidth,this.__client_width=this.__container.clientWidth,this.update_indicator_bars(),this.__container.addEventListener("scroll",(()=>{this.__scroll_left=this.__container.scrollLeft,this.update_indicator_bars()}),{passive:!0}),new Scroll(this.__container,1),new ScrollSnap(this.__container,1,this,"planning-viewer > day-viewer"),window.addEventListener("resize",(()=>{this.__resize_scroll(),this.update_indicator_bars()}),{passive:!0})}reset(){this.data=void 0,this.__days_element={},this.start_date=void 0,this.end_date=void 0,this.__first_load=!0,this.__intersection_observer.disconnect(),this.innerHTML="",this.__scroll_left=this.__container.scrollLeft,this.__scroll_width=this.__container.scrollWidth,this.__client_width=this.__container.clientWidth,this.update_indicator_bars()}__resize_scroll(){const t=this.__scroll_width-this.__client_width,e=this.__container.scrollWidth-this.__container.clientWidth;this.__container.scrollLeft=(this.__scroll_left+this.__client_width/2)/t*e-this.__container.clientWidth/2,this.__scroll_left=this.__container.scrollLeft,this.__scroll_width=this.__container.scrollWidth,this.__client_width=this.__container.clientWidth}__update_indicator_bars=debounce((()=>{this.__left_bar.style.opacity=0,this.__right_bar.style.opacity=0}),1e3);update_indicator_bars=()=>{const t=this.__container.scrollWidth-this.__container.clientWidth;this.__update_indicator_bars(),requestAnimationFrame((()=>{if(t){const e=this.__container.scrollLeft/t;this.__left_bar.style.opacity=.5,this.__right_bar.style.opacity=.5,e>=1?(this.__left_bar.style.display="block",this.__right_bar.style.display="none"):e<=0?(this.__left_bar.style.display="none",this.__right_bar.style.display="block"):(this.__left_bar.style.display="block",this.__right_bar.style.display="block")}else this.__left_bar.style.display="none",this.__right_bar.style.display="none"}))};focus(t,e=!1){t instanceof Date&&(t=t.toISOString()),this.__days_element[t]&&(e&&(this.__container.style.scrollBehavior="auto"),this.__container.scrollLeft=this.__days_element[t].getBoundingClientRect().x-this.__container.clientWidth/2+this.__days_element[t].clientWidth/2,this.__scroll_left=this.__container.scrollLeft,this.__scroll_width=this.__container.scrollWidth,this.__client_width=this.__container.clientWidth,e&&(this.__container.style.scrollBehavior=""))}load(t){this.data=t;let e=new Date(t?.start_date),n=new Date(t?.end_date);if(this.__intersection_observer.disconnect(),this.__scroll_left=this.__container.scrollLeft,this.__scroll_width=this.__container.scrollWidth,this.__client_width=this.__container.clientWidth,planning_resources_name[t?.level]?.name_list[t?.group]&&e.toJSON()&&n.toJSON()&&compare_date(e,n)>0&&t?.days?.length&&t.days.every((t=>new Date(t.date).toJSON()))){e=keep_only_date(e),n=keep_only_date(n),this.start_date||(this.start_date=e),this.end_date||(this.end_date=n);const i=[];let s=new Date(e);for(;compare_date(s,n);)i.push(s.toISOString()),s=add_days(s,1);for(const t of i)this.__days_element[t]||(this.__days_element[t]=document.createElement("day-viewer"),this.__days_element[t].dataset.date=t,compare_date(this.start_date,t)<0?(this.__days_element[this.start_date.toISOString()].before(this.__days_element[t]),this.__scroll_left+=this.__container.scrollWidth-this.__scroll_width):this.append(this.__days_element[t]),this.__scroll_width=this.__container.scrollWidth);for(const n in this.__days_element)if(i.includes(n))this.__days_element[n].load(t.days.find((t=>t.date==n)),n);else{const t=this.__days_element[n].dataset.date;this.__days_element[n].delete(),delete this.__days_element[n],compare_date(t,e)>0&&(this.__scroll_left+=this.__container.scrollWidth-this.__scroll_width),this.__scroll_width=this.__container.scrollWidth}this.start_date=e,this.end_date=n,this.__first_load?(this.__first_load=!1,this.focus(keep_only_date(new Date),!0)):(this.__container.scrollLeft=this.__scroll_left,this.__scroll_left=this.__container.scrollLeft,this.__scroll_width=this.__container.scrollWidth,this.__client_width=this.__container.clientWidth),this.__intersection_observer.observe(this.children[0]),this.__intersection_observer.observe(this.children[this.children.length-1])}this.update_indicator_bars()}}class DayViewer extends HTMLElement{__lessons_element={};__date_element=document.createElement("h2");__day_element=document.createElement("h3");__top_bar=document.createElement("div");__container=document.createElement("div");__bottom_bar=document.createElement("div");constructor(){super(),this.attachShadow({mode:"open"});const t=document.createElement("style"),e=document.createElement("time");e.append(this.__date_element),e.append(this.__day_element),t.textContent="\n    * {\n      position: relative;\n      z-index: 0;\n      margin: 0;\n      padding: 0;\n    }\n    \n    :host {\n      display: inline-block;\n\n      flex-shrink: 0;\n\n      height: 100%;\n      width: 95vmin;\n\n      padding: 0 2.5vmin !important;\n    }\n\n    time {\n      position: absolute;\n      top: 0;\n      \n      width: 95vmin;\n    }\n\n    h2 {\n      padding: 1em;\n      padding-bottom: 0;\n\n      text-align: center;\n    }\n\n    h3 {\n      padding-bottom: 0.2em;\n\n      text-align: center;\n\n      font-size: 1em;\n    }\n\n    .container {\n      position: absolute;\n      top: 4.7em;\n\n      height: calc(100% - 5em - 2.5vmin);\n      width: 95vmin;\n\n      border-radius: 0.5em;\n    }\n\n    .top-bar, .bottom-bar {\n      position: absolute;\n      left: 50%;\n      z-index: 1;\n\n      height: 0.2em;\n      width: 80%;\n\n      opacity: 0.5;\n\n      border-radius: 0.2em;\n\n      translate: -50% 0.2em;\n\n      background-color: var(--color-dark-0);\n\n      transition: 0.3s ease-in-out opacity;\n    }\n\n    .bottom-bar {\n      translate: -50% -0.4em;\n    }\n    ",this.__top_bar.classList.add("top-bar"),this.__bottom_bar.classList.add("bottom-bar");const n=document.createElement("slot");this.__container.classList.add("container"),this.__container.append(n),this.shadowRoot.append(t,e,this.__top_bar,this.__container,this.__bottom_bar),this.update_indicator_bars(),this.__container.addEventListener("scroll",this.update_indicator_bars,{passive:!0}),new Scroll(this.__container,2),new ScrollSnap(this.__container,2,this,"day-viewer > lesson-viewer"),window.addEventListener("resize",this.update_indicator_bars,{passive:!0})}delete(){window.removeEventListener("resize",this.update_indicator_bars,{passive:!0}),this.remove()}__update_indicator_bars=debounce((()=>{this.__top_bar.style.opacity=0,this.__bottom_bar.style.opacity=0}),1e3);update_indicator_bars=()=>{const t=this.__container.scrollHeight-this.__container.clientHeight;this.__update_indicator_bars(),requestAnimationFrame((()=>{if(t){const e=this.__container.scrollTop/t;this.__top_bar.style.opacity=.5,this.__bottom_bar.style.opacity=.5,e>=1?(this.__top_bar.style.display="block",this.__bottom_bar.style.display="none"):e<=0?(this.__top_bar.style.display="none",this.__bottom_bar.style.display="block"):(this.__top_bar.style.display="block",this.__bottom_bar.style.display="block")}else this.__top_bar.style.display="none",this.__bottom_bar.style.display="none"}))};load(t,e){if(this.__date_element.textContent=new Intl.DateTimeFormat("default",{dateStyle:"long"}).format(new Date(e)),this.__day_element.textContent=new Intl.DateTimeFormat("default",{weekday:"long"}).format(new Date(e)),t?.lessons?.length&&t.lessons.every((t=>new Date(t.start_date).toJSON()&&new Date(t.end_date).toJSON()))){const e=Object.keys(this.__lessons_element),n=t.lessons.reduce(((t,e)=>(t[e.start_date+e.end_date]=e,t)),{});for(const t of e)n[t]?(this.__lessons_element[t].load(n[t]),delete n[t]):(this.__lessons_element[t]?.remove(),delete this.__lessons_element[t]);for(const t in n){const e=document.createElement("lesson-viewer");e.dataset.start_date=n[t].start_date,e.dataset.end_date=n[t].end_date,e.load(n[t]);const i=[...this.children];let s=i.findLast((e=>compare_date(n[t].end_date,e.dataset.start_date)<=0));if(s)s.after(e);else{let s=i.find((e=>compare_date(n[t].start_date,e.dataset.end_date)>=0));s?s.before(e):this.appendChild(e)}this.__lessons_element[t]=e}}else this.__lessons_element={},this.innerHTML="";this.update_indicator_bars()}}class LessonViewer extends HTMLElement{__container=document.createElement("div");__title_element=document.createElement("h3");__description_element=document.createElement("p");__start_date_element=document.createElement("time");__end_date_element=document.createElement("time");__rooms_element=document.createElement("span");data=null;__show_state=!1;constructor(){super(),this.attachShadow({mode:"open"});const t=document.createElement("style");t.textContent="\n    * {\n      position: relative;\n      z-index: 0;\n      margin: 0;\n      padding: 0;\n    }\n      \n    :host {\n      display: block;\n\n      margin: 1.5em 0 !important;\n\n      width: 100%;\n\n      box-sizing: border-box;\n\n      padding: 0.5em !important;\n\n      border-radius: 0.5em;\n\n      color: var(--color-dark-1);\n\n      background: linear-gradient(180deg, var(--color-light-1) 0%, var(--color-light-1) 50%, var(--color-accent-1) 50%, var(--color-accent-1) 100%);\n      background-size: 100% 201%;\n      background-position-y: 100%;\n\n      cursor: pointer;\n    }\n\n    h3 {\n      width: 100%;\n\n      overflow: hidden;\n\n      text-overflow: ellipsis;\n      white-space: nowrap;\n    }\n\n    div.show h3 {\n      white-space: normal;\n    }\n\n    p {\n      display: none;\n\n      margin-top: 1em;\n    }\n\n    div.show p {\n      display: block;\n    }\n\n    .bottom-bar {\n      display: inline-block;\n\n      margin-top: 1em;\n\n      width: 100%;\n    }\n\n    .rooms {\n      display: inline-block;\n\n      float: right;\n      \n      width: 45%;\n\n      overflow: hidden;\n\n      text-align: right;\n      text-overflow: ellipsis;\n      white-space: nowrap;\n    }\n\n    div.show .rooms {\n      white-space: normal;\n    }\n    ",this.__rooms_element.classList.add("rooms");const e=document.createElement("span");e.classList.add("bottom-bar"),e.append(this.__start_date_element," - ",this.__end_date_element,this.__rooms_element),this.__container.append(this.__title_element,this.__description_element,e),this.shadowRoot.append(t,this.__container),this.addEventListener("pointerdown",(()=>{this.show(),setTimeout((()=>this.scrollIntoView({inline:"center",behavior:"smooth"})),50)})),this.addEventListener("focusout",(()=>{this.hide()})),window.requestAnimationFrame((()=>{let t;this.tabIndex=0;const e=()=>{window.requestAnimationFrame((()=>{if(compare_date(this.dataset.end_date,new Date)>=0)this.style.backgroundPositionY="0%",clearInterval(t);else if(compare_date(this.dataset.start_date,new Date)>=0){const t=new Date(this.dataset.end_date).getTime()-new Date(this.dataset.start_date).getTime(),e=new Date(this.dataset.end_date).getTime()-new Date;this.style.backgroundPositionY=e/t*100+"%"}}))};t=setInterval(e,12e4),e()}))}show(){this.data&&!this.__show_state&&(this.__container.classList.add("show"),this.__rooms_element.innerHTML=this.__rooms_element.innerHTML.replaceAll(", ","<br>"),this.__show_state=!0)}hide(){this.data&&this.__show_state&&(this.__container.classList.remove("show"),this.__rooms_element.innerHTML=this.__rooms_element.innerHTML.replaceAll("<br>",", "),this.__show_state=!1)}load(t){if("string"==typeof t?.title&&t?.description?.length&&t.description.every((t=>"string"==typeof t))&&t?.rooms?.length&&t.rooms.every((t=>"string"==typeof t))&&new Date(t.start_date).toJSON()&&new Date(t.end_date).toJSON()){const e=new Intl.DateTimeFormat("default",{timeStyle:"short"});t.title.match(/exam|qcm|contrôle|partiel|soutenance/i)?this.style.backgroundImage="linear-gradient(180deg, #f9d2d9 0%, #f9d2d9 50%, #f9335f 50%, #f9335f 100%)":t.title.match(/cour|cm|conférence/i)?this.style.backgroundImage="linear-gradient(180deg, #faefce 0%, #faefce 50%, #fcd570 50%, #fcd570 100%)":t.title.match(/td|gr[ ]*[a-c]/i)?this.style.backgroundImage="linear-gradient(180deg, #ddf8e8 0%, #ddf8e8 50%, #74eca8 50%, #74eca8 100%)":t.title.match(/tp|gr[ ]*[1-6]/i)&&(this.style.backgroundImage="linear-gradient(180deg, #dcf9f6 0%, #dcf9f6 50%, #70f0ee 50%, #70f0ee 100%)"),this.__title_element.textContent=t.title,this.__description_element.textContent=t.description.join("\n"),this.__description_element.innerHTML=this.__description_element.innerHTML.replaceAll("\n","<br>"),this.__start_date_element.textContent=e.format(new Date(t.start_date)),this.__start_date_element.dateTime=t.start_date,this.__end_date_element.textContent=e.format(new Date(t.end_date)),this.__end_date_element.dateTime=t.end_date,this.__rooms_element.textContent=t.rooms.join(", "),this.data=t}else this.__title_element.textContent="",this.__start_date_element.textContent="",this.__start_date_element.dateTime="",this.__end_date_element.textContent="",this.__end_date_element.dateTime="",this.__rooms_element.textContent="",this.data=null}}class PlanningButton extends HTMLElement{__level;__group;__svg_element;__switch_planning_callback;__fetch_favorite_planning_callback;constructor(){super(),this.attachShadow({mode:"open"});const t=document.createElement("style");t.textContent="\n    :host {\n      display: block;\n\n      height: 1.5em;\n\n      cursor: pointer;\n    }\n\n    svg {\n      margin-right: 0.5em;\n\n      height: 1em;\n\n      fill: transparent;\n      stroke: var(--color-accent-0);\n      stroke-width: 3.5em;\n\n      transition: 0.2s ease-in-out fill, 0.2s ease-in-out stroke;x\n    }\n\n    svg.selected {\n      fill: var(--color-accent-0);\n    }\n\n    svg:hover, svg:focus {\n      stroke: var(--color-accent-1);\n    }\n\n    svg.selected:hover, svg.selected:focus {\n      fill: var(--color-accent-1);\n    }\n    ";const e=document.createElement("slot");this.style.display="",this.shadowRoot.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -10 584 567">\x3c!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --\x3e<path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>',this.shadowRoot.append(t,e),this.__svg_element=this.shadowRoot.firstChild,this.__svg_element.addEventListener("click",(()=>{let t=JSON.parse(localStorage.getItem("favorites"));this.__svg_element.classList.toggle("selected")?(t.push({level:this.__level,group:this.__group}),this.__fetch_favorite_planning_callback(this.__level,this.__group)):(t=t.filter((t=>t.level!=this.__level||t.group!=this.__group)),localStorage.removeItem(`${this.__level}:${this.__group}`)),localStorage.setItem("favorites",JSON.stringify(t))})),this.addEventListener("click",(t=>{t.composedPath().some((t=>t==this.__svg_element))||(history.pushState({level:this.__level,group:this.__group},"",location.origin+location.pathname+`?level=${this.__level}&group=${this.__group}`),this.__switch_planning_callback(this.__level,this.__group))}))}init(t,e,n,i){JSON.parse(localStorage.getItem("favorites")).some((n=>n.level==t&&n.group==e))&&this.__svg_element.classList.add("selected"),this.__level=t,this.__group=e,this.__switch_planning_callback=n,this.__fetch_favorite_planning_callback=i,this.style.display="",this.textContent=planning_resources_name[t].name_list[e]}}customElements.define("planning-viewer",PlanningViewer),customElements.define("day-viewer",DayViewer),customElements.define("lesson-viewer",LessonViewer),customElements.define("planning-button",PlanningButton);
