class Scroll{#e;#t;#i={x:0,y:0};#s=.95;#n=!1;#l=!1;constructor(e,t=0){this.#e=t,this.#t=e,this.#o=this.#o.bind(this),this.#r=this.#r.bind(this),this.#h=this.#h.bind(this),this.#p=this.#p.bind(this),this.#t.style.overflow="hidden",e.addEventListener("wheel",this.#o,{passive:!0}),e.addEventListener("pointerdown",this.#r)}#o=e=>{this.#t.style.scrollBehavior="auto",this.#t.style.scrollSnapType="none",this.apply_scroll(e.deltaX,e.deltaY,e.shiftKey)};#r=e=>{this.#n=!0,this.#i.x=e.clientX,this.#i.y=e.clientY,this.#t.style.scrollBehavior="auto",this.#t.style.scrollSnapType="none",this.#t.addEventListener("pointermove",this.#h,{passive:!0}),this.#t.addEventListener("pointerup",this.#p),this.#t.addEventListener("pointercancel",this.#p),this.#t.addEventListener("pointerleave",this.#p),this.#t.addEventListener("lostpointercapture",this.#p)};#h=e=>{this.apply_scroll(this.#i.x-e.clientX,this.#i.y-e.clientY,!1,!1),this.#i.x=e.clientX,this.#i.y=e.clientY};#p=()=>{this.#t.removeEventListener("pointermove",this.#h,{passive:!0}),this.#t.removeEventListener("pointerup",this.#h),this.#t.removeEventListener("pointercancel",this.#p),this.#t.removeEventListener("pointerleave",this.#p),this.#t.removeEventListener("lostpointercapture",this.#p),this.#n=!1,this.#a()};apply_scroll(e,t,i=!1,s=!0){if(s&&(this.#n=!1,this.#l=!1),!this.#n){const i=Math.abs(e)<1,s=Math.abs(t)<1;e*=this.#s,t*=this.#s,i&&(e=0),s&&(t=0),i&&s&&(this.#l=!1)}!this.#l&&this.#n&&(this.#l=!0),window.requestAnimationFrame((()=>{1==this.#e&&(s&&(this.#t.scrollLeft+=t),this.#t.scrollLeft+=e),2==this.#e&&(this.#t.scrollTop+=t,s&&(this.#t.scrollTop+=e)),3==this.#e&&(s&&i?(this.#t.scrollTop+=e,this.#t.scrollLeft+=t):(this.#t.scrollTop+=t,this.#t.scrollLeft+=e)),this.#l&&!this.#n&&this.apply_scroll(e,t,i,s),s||this.#a()}))}#a=debounce((()=>{this.#n||(this.#t.style.scrollBehavior="",this.#t.style.scrollSnapType="")}),50)}