// The six ratings are listed as fleet classes. The catalogue illustrates three press groups.
const pressRatings = [
  [40,'confirm for job'], [90,'confirm for job'], [90,'confirm for job'], [180,'confirm for job'], [180,'confirm for job'], [500,'confirm for job']
];
const resinGuide = [
  ['PP','Polypropylene','Used for hinged lids and lightweight reusable containers.'],
  ['PPCP','Polypropylene copolymer','Useful for crates and housings that need better impact resistance than a rigid PP grade.'],
  ['ABS','Acrylonitrile butadiene styrene','Used for appliance housings and rigid enclosures with a smooth finish.'],
  ['PC','Polycarbonate','Used for clear, impact-resistant guards and covers.'],
  ['Nylon / PA','Polyamide','Used for gears and wear-resistant mechanical parts.'],
  ['HDPE','High-density polyethylene','Used for tough caps, closures and rigid containers.'],
  ['LDPE','Low-density polyethylene','Used for soft protective plugs and flexible caps.'],
  ['LLDPE','Linear low-density polyethylene','Used for flexible lids and impact-resistant moulded components.'],
  ['PVC','Polyvinyl chloride','Rigid grades are used for pipe fittings and electrical conduit fittings.'],
  ['PS','Polystyrene','Used for rigid trays and packaging components.'],
  ['POM','Acetal / polyoxymethylene','Used for low-friction gears, guides and bearings.'],
  ['PMMA','Acrylic','Used for clear lenses, covers and light guides.'],
  ['TPR','Thermoplastic rubber','Used for soft grips and cushioning pads.'],
  ['TPE','Thermoplastic elastomer','Used for flexible seals and soft-touch overmoulds.'],
  ['TPU','Thermoplastic polyurethane','Used for abrasion-resistant wheels and flexible protective parts.']
];

function label(eyebrow,title,facts,use) { return {eyebrow,title,facts,use}; }
const unitEntry = 29;
const unitExit = 49;
const routeTime = filmTime => filmTime > unitEntry ? filmTime + unitExit - unitEntry : filmTime;
const sourceTime = route => route < unitEntry ? route : route < unitExit ? unitEntry : route - (unitExit - unitEntry);
const unitPresses = [
  {time:34.5, colour:'Ochre', side:'Left bay', use:'A small mould fits between the platens. This is where a light clip or cap can be formed with a short shot.'},
  {time:39, colour:'Red', side:'Centre bay', use:'The screw meters enough resin to fill the cavities and runner together. A multi-cavity mould can release several small pieces in one cycle.'},
  {time:43.5, colour:'Teal', side:'Right bay', use:'The larger clamp holds the mould shut as the cavity fills. A moulded cover cools against the tool faces before its ejector pins advance.'}
].map((station,i)=>({...station,tonnes:pressRatings[i][0],shot:pressRatings[i][1]}));
const toolCard = (name,operation,description) => label('Tool room · equipment',name,operation,description);
const mouldGuide = [
  {name:'Single-cavity mould',feature:'Core and cavity',use:'The raised core forms the inside of the blue housing. The matching pocket forms its outside. Together they make one housing per cycle.',detail:'Look at the gap between the two steel shapes when they close. That space gives the cover its walls, rim and corners.'},
  {name:'Four-cavity mould',feature:'Four matching cores',use:'Each round core shapes the inside of a cap. Four matching cavities let the tool make four caps in one shot.',detail:'The runner divides the incoming melt between the cavities. Each cavity and its core form a complete cap, so all four parts can cool during the same cycle.'},
  {name:'Side-action mould',feature:'Sliding side core',use:'The slide enters the cavity from the side to form an opening in the housing. It withdraws before the housing is ejected.',detail:'A side opening can trap a part on a fixed core. The moving steel insert gives the mould a second direction in which to release it.'},
  {name:'Hot-runner mould',feature:'Heated manifold',use:'Heaters keep plastic molten in the manifold between shots. Nozzles carry the melt from that manifold to the cavities.',detail:'Follow the heater leads into the steel assembly. The feed channels stay hot while the moulded part cools in its cavity, so the next shot can use the melt already in the runner.'}
];
const mouldDisplay={
  name:'Tool Room I mould display', image:'assets/mould-bench.webp', aspect:1.5,
  cellWidth:.49,cellHeight:.495,plateOffset:.192,
  items:[
    {code:'Core & cavity',x:.25,y:.25,pinX:.350,pinY:.185},
    {code:'Four cores',x:.75,y:.25,pinX:.737,pinY:.224},
    {code:'Side core',x:.75,y:.75,pinX:.832,pinY:.648},
    {code:'Heated runner',x:.25,y:.75,pinX:.205,pinY:.631}
  ].map((item,i)=>({...item,name:mouldGuide[i].name}))
};
const tagStops = [
  {time:5.5,kind:'office',pin:[.256,.261,.141,.414],cards:[label('Factory entrance','Office cabin','Through the glass, on the left','The CEO and a visitor are seated across the desk. Scroll closer to join their conversation.')]},
  {time:17.25,kind:'moulds',pin:[.636,.496,.70,.68],cards:[label('Moulding hall · floor tooling','Injection moulds','Core and cavity halves','These steel blocks sit in front of the presses. Fitted together, their machined surfaces form the cavity that gives a part its shape.')]},
  {time:19,pin:[.61,.50],press:true,cards:[
    label('Moulding hall · injection','180-tonne servo press','Feed hopper and injection barrel','Pellets drop from the hopper into the heated barrel. A rotating screw prepares the next shot.')]},
  {time:23,pin:[.55,.51],press:true,cards:[label('Moulding hall · servo drive','Tokima servo press','Filling and holding','The servo drive varies its output as the cavity fills and pressure builds behind the cooling part.')]},
  {time:27,pin:[.575,.562,.61,.529],press:true,cards:[label('Moulding hall · high speed','500-tonne press','500 t clamp  ·  shot capacity verified per job','The blue clamp holds the steel mould halves together while the injection unit fills the cavity.')]},
  ...unitPresses.map(s=>({time:s.time,unit:true,press:true,cards:[label('Tooling operations · '+s.side,s.tonnes+'-tonne press',s.tonnes+' t clamp · shot capacity verified per job',s.use)]})),
  {time:56,kind:'mould-bench',cards:mouldGuide.map(m=>label('Tool Room I · Mould making',m.name,m.feature,m.use))},
  {time:40,pin:[.36,.48],cards:[toolCard('Universal milling machine','Cutting flats, slots and cavities','A rotating cutter removes steel from mould bases, cores and fixtures.')]},
  {time:44,pin:[.48,.47],cards:[toolCard('Centre lathe','Turning round components','The chuck spins the workpiece against a cutting tool to shape shafts, bushes and sleeves.')]},
  {time:48,pin:[.53,.43],cards:[toolCard('Bench grinder','Sharpening and deburring','Two abrasive wheels sharpen cutting tools and remove burrs from metal edges.')]},
  {time:52,pin:[.61,.44],cards:[toolCard('Pillar drill','Drilling and tapping','The vertical spindle makes holes for ejector pins, cooling passages and fasteners.')]},
  {time:64,pin:[.47,.50],cards:[toolCard('Wire EDM','Electrical discharge machining','A moving wire cuts intricate profiles in conductive tool steel.')]},
  {time:68,pin:[.48,.48],cards:[toolCard('Surface grinder','Precision flat finishing','The abrasive wheel finishes the mating faces of mould plates and inserts.')]},
  {time:72,pin:[.68,.46],cards:[label('Quality checking cabin','Naveen Raj S.','Plant Manager','The tour places the plant manager at inspection, where the sample is checked against its drawing with calipers, micrometers and gauges.')]},
  {time:84,kind:'samples',cards:resinGuide.map(([code,name,use])=>label('Raw material store · '+code,name,code+'  /  polymer sample',use))},
  {time:88,pin:[.53,.48],cards:[label('Material recovery','Plastic granulator','Sprues and runners → regrind','Cutters break sorted offcuts into granules. Regrind can enter another batch when the resin grade and customer specification allow it.')]},
].map(stop=>({...stop, time:stop.unit ? stop.time : routeTime(stop.time)})).sort((a,b)=>a.time-b.time);
// Additional scroll travel keeps the camera on the same bay while the visitor reads each tag.
const readingInterval = 1.70;
let addedTime = 0;
for (const stop of tagStops) {
  stop.start = stop.time + addedTime;
  stop.length = stop.cards.length*readingInterval;
  addedTime += stop.length;
}
function movieAtStory(story) {
  let extra=0;
  for (const stop of tagStops) {
    if (story<stop.start) break;
    if (story<=stop.start+stop.length) return stop.time;
    extra+=stop.length;
  }
  return story-extra;
}
function storyAtMovie(time) {
  let extra=0;
  for (const stop of tagStops) {
    if(Math.abs(time-stop.time)<.01) return stop.start+readingInterval*.5;
    if(time<stop.time) break;
    extra+=stop.length;
  }
  return time+extra;
}
function currentTag(story) {
  for (const stop of tagStops) {
    const offset=story-stop.start;
    if (offset<-.72) break;
    if (offset<=stop.length+.67) return {stop,progress:offset/readingInterval-.5,index:Math.min(stop.cards.length-1,Math.max(0,Math.floor(offset/readingInterval))),
      opacity:Math.min(1,Math.max(0,(offset+.72)/.48),Math.max(0,(stop.length+.67-offset)/.45))};
  }
  return null;
}

