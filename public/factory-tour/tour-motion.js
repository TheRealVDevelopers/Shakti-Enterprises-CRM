// Frame-rate-independent easing for both optical close-ups and movie scrubbing.
function smoothTourStory(current,target,elapsed,reducedMotion){
 if(current===null||reducedMotion||Math.abs(target-current)<.01)return target;
 return current+(target-current)*(1-Math.exp(-Math.min(64,Math.max(1,elapsed))/95));
}
