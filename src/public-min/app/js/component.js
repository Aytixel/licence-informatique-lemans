class PlanningFetchEvent extends Event{constructor(t){super("planningfetch"),this.request=t}}document.addEventListener("alpine:init",(()=>{Alpine.data("free_room",(()=>({date_to_time_intl:new Intl.DateTimeFormat("default",{timeStyle:"short",timeZone:"UTC"}),list:{},async update(){if(navigator.onLine){start_loader();try{const t=await(await fetch("https://api.licence-informatique-lemans.tk/v2/find-free-room.json")).json();t?.error||(this.list=t)}catch{}end_loader()}}}))),Alpine.data("planning_selector",(t=>({levels:[],async init(){await planning_resources_loaded,this.levels=planning_resources_type[t]},in_favorites:(t,e)=>JSON.parse(localStorage.getItem("favorites")).some((i=>i.level==t&&i.group==e)),select_favorite(t,e){let i=JSON.parse(localStorage.getItem("favorites"));this.$el.classList.toggle("selected")?(i.push({level:t,group:e}),fetch_favorite_planning(t,e)):(i=i.filter((i=>i.level!=t||i.group!=e)),localStorage.removeItem(`${t}:${e}`)),localStorage.setItem("favorites",JSON.stringify(i))}}))),Alpine.store("planning_viewer",(()=>({data:{},start_date:void 0,end_date:void 0,load(){},reset(){}}))),Alpine.data("planning_viewer",(()=>({data:{},show_left_bar:!1,show_right_bar:!1,first_load:!0,scroll_left:0,scroll_width:0,client_width:0,init(){this.$store.planning_viewer.load=t=>this.load(t),this.$store.planning_viewer.reset=()=>this.reset(),this.update_indicator_bars(),new Scroll(this.$refs.container,1),new ScrollSnap(this.$refs.container,1,this.$refs.container,"[x-data*='day_viewer']")},update_scroll_data(){this.scroll_left=this.$refs.container.scrollLeft,this.scroll_width=this.$refs.container.scrollWidth,this.client_width=this.$refs.container.clientWidth},hide_indicator_bars:debounce((function(){this.show_left_bar=!1,this.show_right_bar=!1}),1e3),update_indicator_bars(){const t=this.$refs.container.scrollWidth-this.$refs.container.clientWidth;if(this.hide_indicator_bars(),t){const e=this.$refs.container.scrollLeft/t;e>=1?(this.show_left_bar=!0,this.show_right_bar=!1):e<=0?(this.show_left_bar=!1,this.show_right_bar=!0):(this.show_left_bar=!0,this.show_right_bar=!0)}else this.show_left_bar=!1,this.show_right_bar=!1},focus(t,e=!1){t instanceof Date&&(t=t.toISOString());const i=this.$refs.container.querySelector(`[data-date="${t}"]`);i&&(e&&(this.$refs.container.style.scrollBehavior="auto"),this.$refs.container.scrollLeft=i.getBoundingClientRect().x-this.$refs.container.clientWidth/2+i.clientWidth/2,this.update_scroll_data(),e&&(this.$refs.container.style.scrollBehavior=""))},load(t){this.data.start_date&&this.data.start_date!=t.start_date&&(this.scroll_left-=compare_date(this.data.start_date,t.start_date)/3600/24/1e3*this.$refs.container.children[1].clientWidth),this.data=t,this.first_load?(this.first_load=!1,this.$nextTick((()=>this.focus(keep_only_date(new Date),!0)))):this.$nextTick((()=>{this.$refs.container.scrollLeft=this.scroll_left,this.update_scroll_data()})),this.$store.planning_viewer.data=t,this.$store.planning_viewer.start_date=new Date(t.start_date),this.$store.planning_viewer.end_date=new Date(t.end_date),this.$refs.container.children[1]?.removeAttribute("x-intersect.threshold.10"),this.$refs.container.children[this.$refs.container.children.length-1]?.removeAttribute("x-intersect.threshold.10"),this.$nextTick((()=>{this.$refs.container.children[1]?.setAttribute("x-intersect.threshold.10","window.dispatchEvent(new PlanningFetchEvent(-1))"),this.$refs.container.children[this.$refs.container.children.length-1]?.setAttribute("x-intersect.threshold.10","window.dispatchEvent(new PlanningFetchEvent(1))")}))},reset(){this.data={},this.first_load=!0,this.update_scroll_data(),this.$store.planning_viewer.data={},this.$store.planning_viewer.start_date=void 0,this.$store.planning_viewer.end_date=void 0,this.update_indicator_bars()},scroll(){this.scroll_left=this.$refs.container.scrollLeft,this.update_indicator_bars()},resize(){const t=this.scroll_width-this.client_width,e=this.$refs.container.scrollWidth-this.$refs.container.clientWidth;this.$refs.container.scrollLeft=(this.scroll_left+this.client_width/2)/t*e-this.$refs.container.clientWidth/2,this.update_scroll_data(),this.update_indicator_bars()}}))),Alpine.data("day_viewer",(t=>({data:t,day_date_format:new $mol_time_moment(t.date),show_top_bar:!1,show_bottom_bar:!1,init(){this.update_indicator_bars(),new Scroll(this.$refs.container,2),new ScrollSnap(this.$refs.container,2,this.$refs.container,"[x-data*='lesson_viewer']")},hide_indicator_bars:debounce((function(){this.show_top_bar=!1,this.show_bottom_bar=!1}),1e3),update_indicator_bars(){const t=this.$refs.container.scrollHeight-this.$refs.container.clientHeight;if(this.hide_indicator_bars(),t){const e=this.$refs.container.scrollTop/t;e>=1?(this.show_top_bar=!0,this.show_bottom_bar=!1):e<=0?(this.show_top_bar=!1,this.show_bottom_bar=!0):(this.show_top_bar=!0,this.show_bottom_bar=!0)}else this.show_top_bar=!1,this.show_bottom_bar=!1}}))),Alpine.data("lesson_viewer",(t=>({data:t,show:!1,init(){let t;const e=()=>{window.requestAnimationFrame((()=>{if(compare_date(this.data.end_date,new Date)>=0)this.$el.style.backgroundPositionY="0%",clearInterval(t);else if(compare_date(this.data.start_date,new Date)>=0){const t=new Date(this.data.end_date).getTime()-new Date(this.data.start_date).getTime(),e=new Date(this.data.end_date).getTime()-new Date;this.$el.style.backgroundPositionY=e/t*100+"%"}}))};t=setInterval(e,12e4),this.$watch("data",e),e()},get_background:t=>t.match(/exam|qcm|contrôle|partiel|soutenance/i)?"background-image: linear-gradient(180deg, #f9d2d9 0%, #f9d2d9 50%, #f9335f 50%, #f9335f 100%);":t.match(/cour|cm|conférence/i)?"background-image: linear-gradient(180deg, #faefce 0%, #faefce 50%, #fcd570 50%, #fcd570 100%);":t.match(/td|gr[ ]*[a-c]/i)?"background-image: linear-gradient(180deg, #ddf8e8 0%, #ddf8e8 50%, #74eca8 50%, #74eca8 100%);":t.match(/tp|gr[ ]*[1-6]/i)?"background-image: linear-gradient(180deg, #dcf9f6 0%, #dcf9f6 50%, #70f0ee 50%, #70f0ee 100%);":""})))}));
