export const CAMPAIGN_SIZE=500;
export const fresh=()=>({version:1,completed:0,health:3,credits:0,skips:0,xp:0});
export function complete(state,skipped=false){
 const s={...state,completed:state.completed+1,xp:state.xp+(skipped?0:100)};
 if(skipped){if(s.skips<1)throw Error('No Skip available');s.skips--;}
 if(s.completed%10===0)s.credits+=2;
 if([100,200,300].includes(s.completed))s.skips++;
 return s;
}
export function spend(state){if(state.completed+1<20||state.credits<1)throw Error('Lifeline unavailable');return {...state,credits:state.credits-1};}
export function load(raw){try{const s=JSON.parse(raw);if(s.version!==1||!['completed','health','credits','skips','xp'].every(k=>Number.isInteger(s[k])&&s[k]>=0)||s.completed>500||s.health>3)return fresh();return s;}catch{return fresh();}}
