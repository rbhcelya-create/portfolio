(function(){
  var T = window.THREE, cv = document.getElementById('space');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  if(!T || calm){ cv.hidden = true; return; }
  var renderer;
  try{ renderer = new T.WebGLRenderer({canvas:cv, antialias:true, alpha:false}); }catch(e){ cv.hidden = true; return; }

  var chs = [].slice.call(document.querySelectorAll('.ch')), N = chs.length, STEP = 42;
  var COL = {blue:0x3B74FF, cyan:0x22D3FF, magenta:0xEC4FD0, violet:0x8B5CF6, amber:0xFF8A4C, ground:0x05060C};

  // ---------- scene ----------
  renderer.setPixelRatio(Math.min(devicePixelRatio||1, 2));
  renderer.setClearColor(COL.ground, 1);
  var scene = new T.Scene(); scene.fog = new T.FogExp2(COL.ground, .017);
  // backdrop: black on the left, blue-cyan sky top right, violet, an orange ember bottom right
  (function(){
    var c=document.createElement('canvas'); c.width=c.height=512; var x=c.getContext('2d');
    x.fillStyle='#05060C'; x.fillRect(0,0,512,512);
    function blob(cx,cy,r,col){ var g=x.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,512,512); }
    x.globalCompositeOperation='lighter';
    blob(520,-10,430,'rgba(30,150,255,.95)'); blob(430,-40,260,'rgba(34,211,255,.55)');
    blob(560,300,330,'rgba(139,92,246,.75)'); blob(330,560,260,'rgba(236,79,208,.28)');
    blob(540,540,230,'rgba(255,122,61,1)');
    scene.background=new T.CanvasTexture(c);
  })();
  var cam = new T.PerspectiveCamera(50, 1, .1, 400);

  function add(o){ scene.add(o); return o; }
  function lineMat(c,o){ return new T.LineBasicMaterial({color:c, transparent:true, opacity:o==null?1:o, blending:T.AdditiveBlending, depthWrite:false}); }
  function glowMat(c,o){ return new T.MeshBasicMaterial({color:c, transparent:true, opacity:o, blending:T.AdditiveBlending, depthWrite:false, side:T.DoubleSide}); }
  function edges(geo,c,o){ return new T.LineSegments(new T.EdgesGeometry(geo), lineMat(c,o)); }
  function wire(geo,c,o){ return new T.LineSegments(new T.WireframeGeometry(geo), lineMat(c,o)); }
  function circle(r,c,seg){ var pts=[]; seg=seg||64; for(var i=0;i<seg;i++){ var a=i/seg*Math.PI*2; pts.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,0)); } return new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), lineMat(c)); }
  function segs(arr,c){ var pts=arr.map(function(p){return new T.Vector3(p[0],p[1],p[2]||0);}); return new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), lineMat(c)); }
  function solidBox(w,h,d,c){ var g=new T.Group(), geo=new T.BoxGeometry(w,h,d); g.add(new T.Mesh(geo,glowMat(c,.10)), edges(geo,c)); return g; }

  // star dust along the whole route
  (function(){
    var n = innerWidth<760 ? 2200 : 4200, pos = new Float32Array(n*3), col = new Float32Array(n*3), len = N*STEP+80;
    var pal = [COL.cyan,COL.magenta,COL.violet,COL.violet,0xffffff,COL.amber].map(function(h){return new T.Color(h);});
    for(var i=0;i<n;i++){
      var a=Math.random()*Math.PI*2, r=4+Math.sqrt(Math.random())*38, c=pal[i%pal.length];
      pos[i*3]=Math.cos(a)*r; pos[i*3+1]=Math.sin(a)*r*.7+2; pos[i*3+2]=30-Math.random()*len;
      col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    }
    var g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3)); g.setAttribute('color',new T.BufferAttribute(col,3));
    add(new T.Points(g,new T.PointsMaterial({size:.16,vertexColors:true,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true})));
  })();

  // the signature: a silk ribbon of light that travels with you
  var ribbon = (function(){
    var S = 56, M = innerWidth<760 ? 160 : 280, pos = new Float32Array(S*(M-1)*2*3), k=0;
    for(var j=0;j<S;j++) for(var i=0;i<M-1;i++) for(var e=0;e<2;e++){ pos[k++]=((i+e)/(M-1))*2-1; pos[k++]=j/(S-1); pos[k++]=0; }
    var g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3));
    var mat=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,
      uniforms:{uT:{value:0},uZ:{value:0},uW:{value:30},uY:{value:-3.1}},
      vertexShader:'uniform float uT; uniform float uZ; uniform float uW; uniform float uY; varying float vX; varying float vV;\nvoid main(){ float x=position.x*uW; float v=position.y; float ph=uT*.32+uZ*.045;\n float y = sin(x*.20+ph)*1.5 + sin(x*.09-ph*.7+1.3)*1.2;\n float tw = x*.17+ph*1.25; y += (v-.5)*sin(tw)*2.6 + sin(x*.6+v*6.283+ph*2.)*.10;\n float z = (v-.5)*cos(tw)*3.2; vX=position.x; vV=v;\n gl_Position = projectionMatrix*modelViewMatrix*vec4(x,y+uY,z,1.); }',
      fragmentShader:'varying float vX; varying float vV;\nvoid main(){ vec3 a=vec3(.23,.45,1.), b=vec3(.55,.36,.96), c=vec3(.93,.31,.82), d=vec3(1.,.54,.30); float t=vX*.5+.5;\n vec3 col = t<.4 ? mix(a,b,t/.4) : (t<.75 ? mix(b,c,(t-.4)/.35) : mix(c,d,(t-.75)/.25)); col = mix(col, vec3(1.), .35);\n float edge = smoothstep(0.,.12,t)*smoothstep(1.,.88,t); gl_FragColor = vec4(col*.34*edge, 1.); }'});
    var m=new T.LineSegments(g,mat); m.frustumCulled=false; m.renderOrder=-1; return add(m);
  })();

  // gates you fly through between chapters
  var gates = [];
  for(var i=0;i<N-1;i++){
    var sides = [96,6,4,3,6,96,4,6,96][i%9], c = [COL.cyan,COL.violet,COL.magenta,COL.amber,COL.blue][i%5], g = new T.Group();
    g.add(new T.Mesh(new T.TorusGeometry(11,.045,8,sides), glowMat(c,1)));
    g.add(new T.Mesh(new T.TorusGeometry(11,.3,8,sides), glowMat(c,.16)));
    g.add(new T.Mesh(new T.TorusGeometry(13.5,.025,8,sides), glowMat(c,.5)));
    g.position.z = -(i+.5)*STEP; g.rotation.z = sides===4 ? Math.PI/4 : 0; gates.push(add(g));
  }

  // ---------- chapter objects ----------
  var objs = [];   // {g, i, side, spin(t)}
  function place(g,i,side,spin){ g.userData={i:i,side:side}; objs.push({g:add(g),i:i,side:side,spin:spin||function(){}}); return g; }

  // 1 · about: liquid neon core
  var coreMat = new T.ShaderMaterial({uniforms:{uT:{value:0},uA:{value:new T.Color(COL.cyan)},uB:{value:new T.Color(COL.magenta)},uC:{value:new T.Color(COL.amber)}},
    vertexShader:'uniform float uT; varying vec3 vN; varying vec3 vV; varying float vD;\nvoid main(){ vec3 p=position; float d = sin(p.x*1.7+uT*1.1)*cos(p.y*2.1+uT*.8)*.20 + sin(p.z*2.6-uT*1.3+p.x)*.13 + cos(p.y*4.+uT*1.6)*.06; vD=d; p += normal*d;\n vec4 mv = modelViewMatrix*vec4(p,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader:'uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; varying vec3 vN; varying vec3 vV; varying float vD;\nvoid main(){ float f = pow(1.-abs(dot(normalize(vN),vV)),2.0); vec3 c = mix(uA,uB,smoothstep(-.6,.7,vN.y+vD*2.)); c = mix(c,uC,smoothstep(.0,.9,vN.x)); gl_FragColor = vec4(c*f*1.9 + vec3(.015,.02,.06) + c*.07, 1.); }'});
  (function(){
    var g=new T.Group(); g.add(new T.Mesh(new T.SphereGeometry(2,128,96),coreMat));
    var halo=wire(new T.IcosahedronGeometry(3.1,1),COL.violet,.35); g.add(halo);
    var r1=circle(3.7,COL.cyan,120), r2=circle(4.1,COL.magenta,120); r1.rotation.x=1.2; r2.rotation.x=1.9; r2.rotation.y=.5; g.add(r1,r2);
    place(g,1,-1,function(t){ halo.rotation.y=t*.2; halo.rotation.x=t*.13; r1.rotation.z=t*.4; r2.rotation.z=-t*.3; });
  })();
  // 2 · travel quotation: globe + orbiting route
  (function(){
    var g=new T.Group(), globe=wire(new T.IcosahedronGeometry(1.7,3),COL.cyan,.55); g.add(globe);
    g.add(new T.Mesh(new T.SphereGeometry(1.66,32,24),new T.MeshBasicMaterial({color:0x04101c})));
    var orbit=new T.Group(), ring=circle(2.5,COL.amber,120), dot=new T.Mesh(new T.SphereGeometry(.11,12,12),glowMat(COL.amber,1)); dot.position.x=2.5; orbit.add(ring,dot); orbit.rotation.x=1.25; orbit.rotation.y=.3; g.add(orbit);
    var o2=new T.Group(), ring2=circle(2.9,COL.magenta,120), dot2=dot.clone(); dot2.material=glowMat(COL.magenta,1); dot2.position.x=2.9; o2.add(ring2,dot2); o2.rotation.x=1.9; o2.rotation.y=-.6; g.add(o2);
    place(g,2,1,function(t){ globe.rotation.y=t*.25; orbit.rotation.z=t*.7; o2.rotation.z=-t*.5; });
  })();
  // 3 · production: a stack of documents fanning
  (function(){
    var g=new T.Group(), sheets=[];
    for(var i=0;i<6;i++){ var s=solidBox(2.6,.05,1.8,[COL.amber,COL.magenta,COL.violet][i%3]); s.position.y=(i-2.5)*.5; sheets.push(s); g.add(s); }
    g.rotation.x=.45;
    place(g,3,-1,function(t){ sheets.forEach(function(s,i){ s.rotation.y=Math.sin(t*.8+i*.5)*.5; s.position.x=Math.sin(t*.6+i)*.25; }); g.rotation.y=t*.15; });
  })();
  // 4 · project platform: kanban columns in depth
  (function(){
    var g=new T.Group(), cards=[], cols=[3,4,2,3], cc=[COL.violet,COL.cyan,COL.magenta,COL.amber];
    cols.forEach(function(n,ci){ for(var k=0;k<n;k++){ var b=solidBox(.95,.5,.08,cc[ci]); b.position.set((ci-1.5)*1.15, 1.2-k*.65, 0); b.userData.ph=ci*1.3+k; cards.push(b); g.add(b); } });
    g.add(segs([[-2.4,1.65,0],[2.4,1.65,0]],COL.violet));
    place(g,4,1,function(t){ cards.forEach(function(b){ b.position.z=Math.sin(t*1.1+b.userData.ph)*.35; }); g.rotation.y=Math.sin(t*.4)*.5-.2; g.rotation.x=Math.sin(t*.3)*.12; });
  })();
  // 5 · cycling event: a bicycle drawn in light
  (function(){
    var g=new T.Group(), wheels=[];
    [-1.45,1.45].forEach(function(x){ var w=new T.Group(); w.add(circle(1,COL.magenta,72), circle(.93,COL.magenta,72), circle(.1,COL.cyan,16));
      var sp=[]; for(var i=0;i<14;i++){ var a=i/14*Math.PI*2; sp.push([0,0,0],[Math.cos(a)*.93,Math.sin(a)*.93,0]); } var s=segs(sp,COL.magenta); s.material.opacity=.5; w.add(s);
      w.position.x=x; wheels.push(w); g.add(w); });
    g.add(segs([[-1.45,0],[-.55,1.15],[-.55,1.15],[.95,1.15],[.95,1.15],[1.45,0],[-.55,1.15],[.05,0],[.05,0],[-1.45,0],[.05,0],[.95,1.15],
                [-.55,1.15],[-.7,1.5],[-.95,1.5],[-.45,1.5],[.95,1.15],[1.05,1.6],[1.05,1.6],[1.4,1.55]],COL.cyan));
    g.add(circle(.22,COL.amber,24)); g.children[g.children.length-1].position.set(.05,0,0);
    g.scale.setScalar(1.15);
    place(g,5,-1,function(t){ wheels.forEach(function(w){ w.rotation.z=-t*2.2; }); g.rotation.y=Math.sin(t*.5)*.6; g.position.y+=Math.sin(t*1.4)*.002; });
  })();
  // 6 · AVS mobile app: a phone with two people connecting
  (function(){
    var g=new T.Group(); g.add(solidBox(1.7,3.3,.14,COL.cyan));
    var a=circle(.32,COL.amber,32), b=circle(.32,COL.magenta,32); a.position.set(0,.85,.12); b.position.set(0,-.85,.12); g.add(a,b);
    var link=segs([[0,.5,.12],[0,-.5,.12]],0xffffff); g.add(link);
    var pulse=circle(.2,0xffffff,32); pulse.position.z=.12; g.add(pulse);
    g.add(segs([[-.25,1.45,.08],[.25,1.45,.08]],COL.cyan));
    place(g,6,1,function(t){ g.rotation.y=Math.sin(t*.6)*.7; g.rotation.x=Math.sin(t*.4)*.15; var k=(t*.6)%1; pulse.scale.setScalar(1+k*5); pulse.material.opacity=1-k; });
  })();
  // 7 · services: three interlocked rings
  (function(){
    var g=new T.Group(), rs=[COL.cyan,COL.magenta,COL.amber].map(function(c,i){ var m=new T.Group(); m.add(new T.Mesh(new T.TorusGeometry(2.3,.03,8,120),glowMat(c,1)), new T.Mesh(new T.TorusGeometry(2.3,.16,8,120),glowMat(c,.14))); m.rotation.x=i*1.05; m.rotation.y=i*.7; g.add(m); return m; });
    place(g,7,0,function(t){ rs.forEach(function(m,i){ m.rotation.z=t*(.3+i*.12); m.rotation.x+=.002*(i+1); }); });
  })();
  // 8 · method: five beacons in a row, lighting in sequence
  (function(){
    var g=new T.Group(), bs=[COL.cyan,COL.violet,COL.magenta,COL.amber,COL.cyan].map(function(c,i){ var o=new T.Group(), geo=new T.OctahedronGeometry(.55,0); var fill=new T.Mesh(geo,glowMat(c,.2)); o.add(fill,edges(geo,c)); o.position.x=(i-2)*2.1; o.userData.fill=fill; g.add(o); return o; });
    g.add(segs([[-4.2,0,0],[4.2,0,0]],COL.violet)); g.position.y=2.6;
    place(g,8,0,function(t){ bs.forEach(function(o,i){ o.rotation.y=t*.8+i; var k=Math.max(0,Math.sin(t*1.2-i*.9)); o.userData.fill.material.opacity=.12+k*.7; o.scale.setScalar(1+k*.25); }); });
  })();
  // 9 · contact: a portal
  (function(){
    var g=new T.Group(), k=wire(new T.TorusKnotGeometry(2.6,.55,160,12,2,3),COL.magenta,.5); g.add(k);
    var rings=[]; for(var i=0;i<5;i++){ var r=circle(3.8+i*.9,[COL.cyan,COL.violet,COL.magenta][i%3],140); r.material.opacity=.7-i*.1; rings.push(r); g.add(r); }
    g.position.z=-6;
    place(g,9,0,function(t){ k.rotation.y=t*.2; k.rotation.x=t*.12; rings.forEach(function(r,i){ r.rotation.z=t*.1*(i%2?1:-1); r.scale.setScalar(1+Math.sin(t*.8+i)*.04); }); });
  })();

  // ---------- layout ----------
  function size(){
    var w=innerWidth, h=innerHeight; renderer.setSize(w,h,false); cam.aspect=w/h; cam.fov = cam.aspect<.8 ? 66 : 50; cam.updateProjectionMatrix();
    var portrait = cam.aspect<1, halfW = Math.tan(cam.fov*Math.PI/360)*9*cam.aspect, halfH = Math.tan(cam.fov*Math.PI/360)*9;
    objs.forEach(function(o){
      var z = -o.i*STEP - 9 + (o.i===9?-6:0);
      if(o.side===0){ o.g.position.set(0, o.i===8 ? (portrait?halfH*1.12:2.7) : 0, z-(portrait?4:2)); o.g.scale.setScalar(portrait?.55:1); o.baseY=o.g.position.y; return; }
      if(portrait){ o.g.position.set(0, halfH*.5, z); o.g.scale.setScalar(.62); }
      else { o.g.position.set(o.side*halfW*.56, 0, z); o.g.scale.setScalar(Math.min(1, halfW/6.2)*(o.i===1?.62:.85)); }
      o.baseY=o.g.position.y;
    });
  }

  // ---------- scroll + chapters ----------
  var track=document.getElementById('track'), rail=document.getElementById('rail'), readout=document.getElementById('readout'), hint=document.getElementById('hint');
  chs.forEach(function(c,i){
    track.appendChild(document.createElement('div'));
    var b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',c.dataset.name); b.dataset.hot='';
    b.addEventListener('click',function(){ scrollTo({top:i*stopH(),behavior:'smooth'}); }); rail.appendChild(b);
  });
  root.classList.add('journey');
  function stopH(){ return track.firstChild.offsetHeight || innerHeight; }
  document.querySelector('.brand').addEventListener('click',function(e){ e.preventDefault(); scrollTo({top:0,behavior:'smooth'}); });

  var p=0, target=0, mx=0,my=0,sx=0,sy=0, lastIdx=-1;
  function readScroll(){ target = Math.max(0, Math.min(N-1, scrollY/stopH())); }
  addEventListener('scroll',readScroll,{passive:true}); addEventListener('resize',function(){ size(); readScroll(); });
  if(fine){
    var cur=document.getElementById('cursor');
    addEventListener('pointermove',function(e){ mx=e.clientX/innerWidth-.5; my=e.clientY/innerHeight-.5; cur.style.opacity=1; cur.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)'; },{passive:true});
    document.querySelectorAll('[data-hot],.pill,.brand').forEach(function(el){ el.addEventListener('pointerenter',function(){cur.classList.add('hot');}); el.addEventListener('pointerleave',function(){cur.classList.remove('hot');}); });
  }
  function smooth(a,b,x){ x=Math.max(0,Math.min(1,(x-a)/(b-a))); return x*x*(3-2*x); }

  function chapters(){
    chs.forEach(function(c,i){
      var d=p-i, a=Math.abs(d), v=1-smooth(.2,.5,a);
      if(v<=.001){ if(c.style.visibility!=='hidden'){ c.style.visibility='hidden'; c.style.opacity=0; c.classList.remove('live'); } return; }
      var e=Math.sign(d)*Math.max(0,a-.12);
      c.style.visibility='visible'; c.style.opacity=v.toFixed(3);
      c.style.transform='translate3d(0,'+(-e*90).toFixed(1)+'px,0) scale('+(1+e*1.1).toFixed(3)+')';
      c.style.filter = a>.2 ? 'blur('+((a-.2)*26).toFixed(1)+'px)' : 'none';
      c.classList.toggle('live', a<.3);
    });
    var idx=Math.round(p);
    if(idx!==lastIdx){ lastIdx=idx; [].forEach.call(rail.children,function(b,i){ b.setAttribute('aria-current', i===idx?'true':'false'); });
      readout.innerHTML='<b>'+('0'+(idx+1)).slice(-2)+'</b> / '+('0'+N).slice(-2)+' · '+chs[idx].dataset.name; }
    hint.style.opacity = p<.15 ? 1 : 0;
  }

  size(); readScroll(); p=target;
  function frame(ms){
    var t=ms/1000, dt=Math.min(.1,t-(frame.last||t)); frame.last=t; p += (target-p)*(1-Math.exp(-dt*5.5)); if(Math.abs(target-p)<.0004) p=target;
    var w=Math.sin(p*Math.PI*2);
    sx+=(mx-sx)*.05; sy+=(my-sy)*.05;
    cam.position.set(w*.9 + sx*1.2, Math.cos(p*Math.PI*2)*.25-.25 - sy*.8, -p*STEP);
    cam.rotation.set(-sy*.12, -sx*.18 - w*.05, w*.07);
    ribbon.material.uniforms.uT.value=t; ribbon.material.uniforms.uZ.value=-cam.position.z; ribbon.position.set(cam.position.x*.6,0,cam.position.z-15);
    coreMat.uniforms.uT.value=t;
    gates.forEach(function(g,i){ g.rotation.z += .0025*(i%2?1:-1); var ahead=cam.position.z-g.position.z; g.visible = ahead>-2 && ahead<STEP*.8; });
    objs.forEach(function(o){ if(Math.abs(p-o.i)<.78){ o.g.visible=true; o.spin(t); o.g.position.y=o.baseY+Math.sin(t*.9+o.i)*.18; } else o.g.visible=false; });
    chapters();
    renderer.render(scene,cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
