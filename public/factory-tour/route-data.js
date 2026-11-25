const filmedScenes = [
  [0,0,"Factory entrance","front-original",null,"Shakthi Enterprises · Bengaluru","Follow a moulded housing from the customer’s drawing to dispatch."],
  [4,0,"Inside the factory","atlas-hall",null,"Entrance view","The CEO’s cabin is on the left. The green, red and blue presses line the aisle on the right. The departments open off the passage at the back."],
  [10,1,"Shakthivel M","factory-office",null,"CEO introduction · dramatised","“Welcome to Shakthi Enterprises. We design moulds and make plastic parts here in Bengaluru. Let’s take this housing out to the presses.”"],
  [19,2,"180-tonne servo press","atlas-hall","180-tonne servo press","High- and medium-speed moulding","The green press represents the catalogue’s high- and medium-speed machines. The listed classes are 180 tonnes high speed, shot capacity verified per job, and 180 tonnes medium speed, shot capacity verified per job."],
  [23,2,"Tokima servo press","atlas-hall","Tokima servo press","Mid-tonnage moulding","The red-and-white machine illustrates the mid-tonnage group. Its screw meters a shot into the closed mould. The catalogue lists capacities by clamp force."],
  [27,2,"500-tonne press","atlas-hall","500-tonne press","500 tonnes · shot capacity verified per job","The blue-and-white press illustrates the largest high-speed machine. Actual component weight depends on the resin, part shape and mould design."],
  [32,0,"Department entrances","atlas-hub",null,"Across the rear aisle","The first opening leads to machining, the middle opening to finishing and quality, and the right-hand opening to materials and dispatch."],
  [36,4,"Tool room I","atlas-tool1",null,"In-house mould making","We make injection moulds here at Shakthi. Follow the machines from the mill on the left to the pillar drill on the right. The moulds are laid out on the workbench beside the drill."],
  [40,4,"Milling machine","atlas-tool1","Milling machine","Universal milling","A rotating cutter machines mould bases, cavities, cores and fixtures."],
  [44,4,"Centre lathe","atlas-tool1","Centre lathe","Heavy-duty turning","The chuck rotates the workpiece while a cutting tool shapes shafts, bushes, sleeves and larger round components."],
  [48,4,"Bench grinder","atlas-tool1","Bench grinder","Bench grinding","The compact twin-wheel grinder at the right-hand bench dresses edges and sharpens tools for the machining bay."],
  [52,4,"Pillar drill","atlas-tool1","Pillar drill","Vertical drilling and tapping","The drill produces holes for ejector pins, cooling passages and fasteners in mould plates."],
  [60,5,"Tool room II","atlas-tool2",null,"Finishing bay","Wire EDM stands on the left, the surface grinder in the centre, and the glass inspection cabin on the right."],
  [64,5,"Wire EDM","atlas-tool2","Wire EDM","Wire cutting · conductive metal","A travelling wire cuts intricate profiles and inserts for tight-fitting mould features."],
  [68,5,"Surface grinder","atlas-tool2","Surface grinder","Precision flat finishing","An abrasive wheel finishes the flat faces of mould plates, inserts and tool components."],
  [72,6,"Quality inspection","atlas-tool2",null,"Quality checking cabin","At the glass bench, the plant manager checks the moulded sample against its drawing. The catalogue lists digital calipers, micrometers, dial gauges and bore gauges."],
  [80,3,"Materials and stock","atlas-stock",null,"Stockroom entrance","Bagged materials and resin samples are on the left, the granulator is in the middle, and packed components are visible through the dispatch opening."],
  [84,3,"Raw material store","atlas-stock",null,"Resin grades and colour samples","Bins and racks separate grades such as PP, ABS, PC and nylon. The resin is selected for the drawing and intended use of the part."],
  [88,3,"Plastic granulator","atlas-stock","Plastic granulator","Sorted sprues and runners","The white hopper feeds segregated offcuts to the cutter. Reuse depends on the material grade and the customer’s specification."],
  [92,7,"Ready stock","atlas-stock",null,"Packing and dispatch","The finished housings are counted and protected in totes, then identified by part and batch for dispatch."]
];
const scenes = filmedScenes.map(([time,room,label,image,detail,specification,narrative],index)=>({
  time:routeTime(time),room,label,detail,specification,narrative,still:'film/stop-'+String(index).padStart(2,'0')+'-{edition}.webp'
}));
scenes.push(
  {time:routeTime(54),room:4,label:'Mould bench',still:'film/tool-bench-{edition}.webp',specification:'Tool Room I · Display bench',narrative:'Here beside the drill are four moulds and the parts they form. Move closer to look down on the bench.'},
  {time:routeTime(56),room:4,label:'Mould display',still:'assets/mould-bench.webp',specification:'Tool Room I · Mould making',narrative:'Four illustrated tools show how cores, slides and runners shape a plastic part.'},
  {time:5.5,room:1,label:'Office cabin',still:'film/office-room-{edition}.webp',specification:'Entrance to the office',narrative:'The glass cabin opens off the main aisle.'},
  {time:17.25,room:2,label:'Injection moulds',still:'film/moulds-{edition}.webp',specification:'Moulding hall · tooling',narrative:'The steel moulds wait beside the presses.'},
  {time:31,room:8,label:'Tooling operations',still:'assets/unit-2.webp',specification:'Injection moulding',narrative:'Three presses share this room. Start with the ochre 40-tonne press on the left, then follow the aisle to the red 90-tonne and teal 90-tonne servo presses.'},
  ...unitPresses.map(p=>({time:p.time,room:8,label:p.tonnes+'-tonne press',still:'assets/unit-2-'+[40,90,100][unitPresses.indexOf(p)]+'.webp',specification:p.tonnes+' t clamp · shot capacity verified per job',narrative:p.use}))
);
scenes.sort((a,b)=>a.time-b.time);

