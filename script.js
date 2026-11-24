(() => {
  'use strict';
  const scene = document.querySelector('#scene');
  const stage = document.querySelector('#bearStage');
  const image = document.querySelector('#bearFallback');
  const pawImage = document.querySelector('#pawImage');
  const forearmImage = document.querySelector('#forearmImage');
  const companionImage=document.querySelector('#companionImage');
  const canvas = document.querySelector('#bearCanvas');
  const paw = document.querySelector('#takePaw');
  const transition = document.querySelector('#transition');
  const journeyBack = document.querySelector('#journeyBack');
  const track=document.querySelector('#walkTrack'),intro=document.querySelector('#introPanel');
  const stageAnchor = stage.nextElementSibling;
  let companionReady=false;
  const hint = document.querySelector('#hint');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  const lowPower=innerWidth<701 || (navigator.hardwareConcurrency||8)<=4;
  let bounds,layoutDirty=true,lastPaint=0,lastPointerAt=0;
  const entranceUntil=performance.now()+1900;
  const invalidateLayout=()=>{layoutDirty=true;};
  window.addEventListener('resize',invalidateLayout,{passive:true});
  window.addEventListener('scroll',invalidateLayout,{passive:true});
  new ResizeObserver(invalidateLayout).observe(stage);
  const motion = { x: 0, y: 0, scale: 0, eyeX: 0, eyeY: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let started = false, near = false, render = null, frame;
  let nextBlink = performance.now() + 4500, blinkStart = -10000;
  const foundSecrets=new Set();
  const announce=document.querySelector('#announcement');
  let blushTimer,boops=0,heartsCaught=0,gameStarted=false;
  const starsLit=new Set();
  const title=document.querySelector('#title');
  const titleRest=title.innerHTML;
  let magicTimer,titleTimer;
  function secretFinale(id) {
    clearTimeout(magicTimer);clearTimeout(titleTimer);
    scene.classList.remove('magic-nose','magic-heart','magic-years');
    void scene.offsetWidth;
    scene.classList.add('magic-'+id);
    const words={nose:['КАК ЖЕ ТЕПЛО','РЯДОМ С ТОБОЙ.'],heart:['МОЁ СЕРДЦЕ','У ТЕБЯ.'],years:['ТЫ И Я.','ПОД ОДНИМ НЕБОМ.']}[id];
    title.replaceChildren(document.createTextNode(words[0]),document.createElement('br'));
    const line=document.createElement('em');line.textContent=words[1];title.append(line);title.classList.add('finale-title');
    titleTimer=setTimeout(()=>{title.innerHTML=titleRest;title.classList.remove('finale-title');},5500);
    const particleLayer=document.querySelector('#magicParticles');
    particleLayer.replaceChildren();
    if(!reduced.matches){
      const origin=id==='nose'?document.querySelector('#noseSecret'):id==='heart'?document.querySelector('#heartSecret'):document.querySelector('#constellation');
      const rect=origin.getBoundingClientRect();
      const particleCount=id==='heart'?(lowPower?20:32):(lowPower?14:24);
      const fragment=document.createDocumentFragment();
      for(let i=0;i<particleCount;i++){
        const mote=document.createElement('i');mote.className='magic-mote';
        const angle=Math.random()*Math.PI*2,distance=100+Math.random()*Math.max(innerWidth,innerHeight)*.7;
        mote.textContent=id==='years'?(i%3?'✦':'✧'):id==='heart'?(i%3?'♥':'♡'):(i%3?'✧':'♡');
        mote.style.cssText=`left:${rect.left+rect.width/2}px;top:${rect.top+rect.height/2}px;--mx:${Math.cos(angle)*distance}px;--my:${Math.sin(angle)*distance}px;--mr:${Math.random()*180-90}deg;--wait:${Math.random()*.5}s;font-size:${12+Math.random()*30}px`;
        fragment.append(mote);mote.addEventListener('animationend',()=>mote.remove(),{once:true});
      }
      particleLayer.append(fragment);
    }
    magicTimer=setTimeout(()=>{scene.classList.remove('magic-'+id);},6500);
  }
  function finishSecret(id) {
    const first=!foundSecrets.has(id);
    foundSecrets.add(id);
    if(first)secretFinale(id);
    document.querySelector('#secretCounter span').textContent=`${foundSecrets.size} / 3`;
    if(foundSecrets.size===3){
      scene.classList.add('all-secrets');
      document.querySelector('.subtitle strong').textContent='Теперь за лапу и пойдём вдвоём ↙';
      announce.textContent='Ты нашла все три секрета. Возьми мишку за лапу и продолжим прогулку вдвоём.';
    }
  }
  document.querySelector('#noseSecret').addEventListener('click',()=>{
    boops++;
    blinkStart=performance.now();
    stage.classList.add('is-blushing');
    const sneeze=boops%3===0;
    document.querySelector('#noseDoodle').textContent=sneeze?'апчхи! ♡':boops%3===1?'буп!':'ещё буп? ♡';
    if(sneeze){canvas.classList.remove('bear-sneeze');void canvas.offsetWidth;canvas.classList.add('bear-sneeze');}
    clearTimeout(blushTimer);blushTimer=setTimeout(()=>{stage.classList.remove('is-blushing');},4500);
    announce.textContent=sneeze?'Мишка чихнул и снова засмущался.':'Мишка покраснел от твоего прикосновения. Потрогай его нос три раза, чтобы он чихнул.';
    finishSecret('nose');
  });
  document.querySelector('#yearsSecret').addEventListener('click',()=>{
    scene.classList.add('star-world');
    document.querySelector('#secretNote').hidden=true;
    document.querySelector('#constellation').hidden=false;
    announce.textContent='Рядом с мишкой появились две звезды. Зажги свою и мою.';
  });
  ['You','Me'].forEach(name=>document.querySelector('#star'+name).addEventListener('click',event=>{
    starsLit.add(name);event.currentTarget.classList.add('lit');event.currentTarget.setAttribute('aria-pressed','true');
    if(starsLit.size===2){
      document.querySelector('#constellation').classList.add('connected');
      document.querySelector('#starCaption').textContent='а теперь у нас одно небо на двоих';
      announce.textContent='Твоя звезда и моя соединились. Теперь у нас своё созвездие.';
      finishSecret('years');
    }
  }));
  document.querySelector('#heartSecret').addEventListener('click',()=>{
    if(gameStarted)return;
    gameStarted=true;
    const sticker=document.querySelector('#heartSecret');
    sticker.innerHTML='<span>♡</span>поймай любовь<br><b>0 / 5</b>';
    scene.classList.add('love-world');
    announce.textContent='Мишка спрятал для тебя пять сердечек. Поймай каждое.';
    [[10,63],[22,35],[86,33],[93,72],[82,83]].forEach(([left,top],index)=>{
      const heart=document.createElement('button');heart.type='button';heart.className='collect-heart';
      heart.textContent='♡';heart.setAttribute('aria-label',`Поймать сердечко ${index+1}`);
      heart.style.cssText=`--heart-left:${left}%;--heart-top:${top}%;--delay:${index*-.7}s`;
      heart.addEventListener('click',()=>{
        heart.remove();heartsCaught++;
        sticker.querySelector('b').textContent=`${heartsCaught} / 5`;
        announce.textContent=`Поймано ${heartsCaught} из пяти сердечек.`;
        if(heartsCaught===5){
          scene.classList.add('heart-unlocked');
          sticker.innerHTML='<span class="sticker-icon">♥</span><span class="sticker-caption">всё моё сердце</span><span class="sticker-sign">у тебя</span>';sticker.classList.add('heart-complete');
          announce.textContent='Ты собрала всё моё сердце.';finishSecret('heart');
        }
      },{once:true});document.querySelector('#loveGame').append(heart);
    });
  });
  // Source-image anchors and the shoulder in the assembled character are distinct.
  // The rounded root is buried behind the torso; the wrist sits inside the palm's fur.
  const shoulder = { x: .36, y: .59 };
  const armRoot = { x: .385, y: .575 };
  const elbow = { x: .265, y: .735 };
  const armWrist = { x: .18, y: .625 };
  const palmWrist = { x: .205, y: .625 };
  const restVector = { x: armWrist.x-armRoot.x, y: armWrist.y-armRoot.y };
  const wristRest = { x: shoulder.x+restVector.x, y: shoulder.y+restVector.y };
  const palmRest = { x: wristRest.x+.185-palmWrist.x, y: wristRest.y+.54-palmWrist.y };
  const upper = { x: elbow.x-armRoot.x, y: elbow.y-armRoot.y };
  const lower = { x: armWrist.x-elbow.x, y: armWrist.y-elbow.y };
  const upperLength = Math.hypot(upper.x,upper.y), lowerLength = Math.hypot(lower.x,lower.y);
  const restUpper = Math.atan2(upper.y,upper.x);
  const restBend = Math.atan2(Math.sin(Math.atan2(lower.y,lower.x)-restUpper),Math.cos(Math.atan2(lower.y,lower.x)-restUpper));
  const rotate = (x,y,angle) => ({x:x*Math.cos(angle)-y*Math.sin(angle),y:x*Math.sin(angle)+y*Math.cos(angle)});
  function armPoint(point, angle) {
    const closest = (a,b) => {
      const dx=b.x-a.x,dy=b.y-a.y;
      const t=clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy),0,1);
      return {x:a.x+dx*t,y:a.y+dy*t};
    };
    const t=clamp((point.x-.16)/.25,0,1),weight=1-t*t*(3-2*t);
    const a=closest(armRoot,elbow),b=closest(elbow,armWrist);
    const center={x:a.x*(1-weight)+b.x*weight,y:a.y*(1-weight)+b.y*weight};
    const full={x:center.x+(point.x-center.x)*1.40,y:center.y+(point.y-center.y)*1.40};
    const turned=rotate(full.x-elbow.x,full.y-elbow.y,angle);
    return {x:full.x*(1-weight)+(elbow.x+turned.x)*weight,y:full.y*(1-weight)+(elbow.y+turned.y)*weight};
  }
  let rig = { wristX: wristRest.x, wristY: wristRest.y, armAngle: 0, elbowAngle: 0, palmAngle: 0, palmX: palmRest.x, palmY: palmRest.y };
  for (let i = 0; i < (lowPower?8:12); i++) {
    const dot = document.createElement('i');
    dot.className = 'firefly';
    dot.style.cssText = `left:${5 + Math.random() * 90}%;top:${24 + Math.random() * 68}%;--duration:${5 + Math.random() * 7}s;--delay:${-Math.random() * 12}s`;
    document.querySelector('#fireflies').append(dot);
  }
  function setupRenderer() {
    // Separate textures guarantee that reaching can never pull pixels from the face or body.
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth:false, stencil:false, powerPreference:'low-power' });
    if (!gl) return;
    const vertex = `
      attribute vec2 aUV; varying mediump vec2 vUV;
      uniform vec2 uWrist; uniform vec2 uEyes;
      uniform vec2 uShoulder; uniform vec2 uArmRoot; uniform vec2 uPalmWrist; uniform vec2 uElbow;
      uniform float uScale; uniform mediump float uLayer; uniform float uBreath; uniform float uBlink;
      uniform float uArmAngle; uniform float uElbowAngle; uniform float uPalmAngle;
      float gaussian(vec2 p, vec2 c, vec2 radius) { vec2 d=(p-c)/radius; return exp(-dot(d,d)*2.0); }
      vec2 rotate(vec2 p,float angle){float c=cos(angle),s=sin(angle);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
      vec2 closestOnBone(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return a+d*clamp(dot(p-a,d)/dot(d,d),0.0,1.0);}
      vec2 warpArm(vec2 point){
        vec2 upperCenter=closestOnBone(point,uArmRoot,uElbow);
        vec2 lowerCenter=closestOnBone(point,uElbow,vec2(.18,.625));
        float weight=1.0-smoothstep(.16,.41,point.x);
        vec2 center=mix(upperCenter,lowerCenter,weight);
        vec2 full=center+(point-center)*1.40;
        return mix(full,uElbow+rotate(full-uElbow,uElbowAngle),weight);
      }
      void main() {
        vec2 p=aUV;
        if(abs(uLayer-2.0)<.25) {
          p=uWrist+rotate((aUV-uPalmWrist)*(1.0+uScale),uPalmAngle);
        } else if(uLayer>.5) {
          // A wide, continuous blend keeps the inner elbow mesh from folding over itself.
          p=uShoulder+rotate(warpArm(aUV)-warpArm(uArmRoot),uArmAngle);
        } else {
        vec2 eyeL=vec2(.438,.307), eyeR=vec2(.660,.311);
        float leftEye=gaussian(aUV,eyeL,vec2(.038,.043));
        float rightEye=gaussian(aUV,eyeR,vec2(.038,.043));
        p+=uEyes*(leftEye+rightEye);
        p.y-=uBlink*.82*((aUV.y-eyeL.y)*leftEye+(aUV.y-eyeR.y)*rightEye);
        }
        // Apply breathing in assembled coordinates so both sides of a joint stay aligned.
        p.x+=(p.x-.54)*uBreath*(1.0-p.y)*.3;
        p.y-=uBreath*(1.0-p.y)*.35;
        vUV=aUV;
        vec2 padded=(p+vec2(.2))/1.4;
        gl_Position=vec4(padded.x*2.0-1.0,1.0-padded.y*2.0,0.0,1.0);
      }`;
    const fragment=`precision mediump float;
      varying mediump vec2 vUV; uniform sampler2D uImage; uniform mediump float uLayer;
      void main(){
        vec4 c=texture2D(uImage,vUV);
        float front=1.0-smoothstep(.28,.36,vUV.x);
        // Keep the rear arm fully opaque. Complementary alpha masks would expose
        // the green background where the two passes overlap outside the torso.
        if(uLayer>2.5)c.a*=front;
        gl_FragColor=vec4(c.rgb*c.a,c.a);
      }`;
    function shader(type,source) {
      const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    function createMesh(cells,box){
      const points=[],indices=[];
      for(let y=0;y<=cells;y++)for(let x=0;x<=cells;x++)points.push(box[0]+x/cells*(box[2]-box[0]),box[1]+y/cells*(box[3]-box[1]));
      for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){
        const a=y*(cells+1)+x,b=a+1,c=a+cells+1;
        indices.push(a,b,c,c,b,c+1);
      }
      const vertices=gl.createBuffer(),elements=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elements);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
      return {vertices,elements,count:indices.length};
    }
    // Crop each mesh to its opaque asset region; rigid palm only needs four vertices.
    const meshes=[createMesh(lowPower?56:72,[.14,0,1,1]),createMesh(36,[.06,.46,.49,.85]),createMesh(1,[0,.29,.38,.68]),createMesh(48,[0,0,1,1])];
    const uv=gl.getAttribLocation(program,'aUV'); gl.enableVertexAttribArray(uv);
    const textures=[image,forearmImage,pawImage,companionImage].map(source=>{
      const texture=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      return texture;
    });
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(gl.getUniformLocation(program,'uImage'),0); gl.clearColor(0,0,0,0);
    const uniforms=Object.fromEntries(['uWrist','uEyes','uScale','uLayer','uBreath','uBlink','uArmAngle','uElbowAngle','uPalmAngle','uShoulder','uArmRoot','uPalmWrist','uElbow'].map(name=>[name,gl.getUniformLocation(program,name)]));
    gl.uniform2f(uniforms.uShoulder,shoulder.x,shoulder.y);
    gl.uniform2f(uniforms.uArmRoot,armRoot.x,armRoot.y);
    gl.uniform2f(uniforms.uPalmWrist,palmWrist.x,palmWrist.y);
    gl.uniform2f(uniforms.uElbow,elbow.x,elbow.y);
    render=(time,blink)=>{
      const size=Math.min(lowPower?1024:1440,Math.round(bounds.width*1.4));
      if (canvas.width!==size) { canvas.width=size; canvas.height=size; gl.viewport(0,0,size,size); }
      gl.uniform2f(uniforms.uWrist,rig.wristX,rig.wristY); gl.uniform2f(uniforms.uEyes,motion.eyeX,motion.eyeY);
      gl.uniform1f(uniforms.uArmAngle,rig.armAngle);gl.uniform1f(uniforms.uPalmAngle,rig.palmAngle);
      gl.uniform1f(uniforms.uElbowAngle,rig.elbowAngle);
      gl.uniform1f(uniforms.uScale,motion.scale);
      gl.uniform1f(uniforms.uBreath,reduced.matches?0:Math.sin(time*.0013)*.008);
      gl.uniform1f(uniforms.uBlink,reduced.matches?0:blink);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // Shoulder behind torso, bent elbow in front, palm over wrist.
      const passes=companionReady?[{layer:0,asset:3}]:[1,0,3,2].map(layer=>({layer,asset:layer===3?1:layer}));
      passes.forEach(({layer,asset})=>{
        const mesh=meshes[asset];
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vertices);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.elements);
        gl.bindTexture(gl.TEXTURE_2D,textures[asset]);
        gl.uniform1f(uniforms.uLayer,layer);
        gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
      });
    };
    stage.classList.add('mesh-ready');
    stage.dataset.renderer='webgl';
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();render=null;stage.classList.remove('mesh-ready');},{once:true});
    canvas.addEventListener('webglcontextrestored',()=>{try{setupRenderer();}catch{render=null;}},{once:true});
  }
  function animate(time) {
    if((started&&!companionReady) || document.hidden || scene.inert)return;
    const interval=lowPower||time-lastPointerAt>1600?1000/30:1000/60;
    if(time-lastPaint<interval-.5){frame=requestAnimationFrame(animate);return;}
    const delta=lastPaint?Math.min(time-lastPaint,100):16.67;
    lastPaint=time;
    if(layoutDirty||time<entranceUntil){bounds=stage.getBoundingClientRect();layoutDirty=false;}
    const rect=bounds;
    const x=(pointer.x-rect.left)/rect.width,y=(pointer.y-rect.top)/rect.height;
    const dx=x-palmRest.x,dy=y-palmRest.y;
    const proximity=pointer.active&&!started?Math.max(0,1-Math.hypot(dx,dy)/.52):0;
    const reach=Math.min(1,proximity*2.1),targetScale=proximity*.06;
    // Reserve the face's silhouette: an enlarged palm must never cover the left eye.
    const faceLimit=.035-targetScale*.18;
    let tx=clamp(dx*reach*.78,-.13,faceLimit);
    const leftLimit=(12-rect.left)/rect.width+.18*(1+targetScale)-.185;
    const rightLimit=(innerWidth-12-rect.left)/rect.width-.18*(1+targetScale)-.185;
    if(leftLimit<Math.min(rightLimit,faceLimit))tx=clamp(tx,leftLimit,Math.min(rightLimit,faceLimit));
    const ty=clamp(dy*reach*.78,-.13,.11),ease=reduced.matches?1:1-Math.pow(.91,delta/16.67);
    motion.x+=((reduced.matches||!render?0:tx)-motion.x)*ease;
    motion.y+=((reduced.matches||!render?0:ty)-motion.y)*ease;
    motion.scale+=((reduced.matches||!render?0:targetScale)-motion.scale)*ease;
    motion.eyeX+=((pointer.active?clamp((x-.55)*.027,-.009,.009):0)-motion.eyeX)*ease;
    motion.eyeY+=((pointer.active?clamp((y-.31)*.023,-.007,.007):0)-motion.eyeY)*ease;
    const vx=wristRest.x+motion.x*.75-shoulder.x;
    const vy=wristRest.y+motion.y*.75-shoulder.y;
    // Two fixed-length bones: solve the wrist target by rotating shoulder and elbow.
    const distance=clamp(Math.hypot(vx,vy),Math.abs(upperLength-lowerLength)+.01,upperLength+lowerLength-.01);
    const bend=Math.acos(clamp((distance*distance-upperLength*upperLength-lowerLength*lowerLength)/(2*upperLength*lowerLength),-1,1));
    const solvedUpper=Math.atan2(vy,vx)-Math.atan2(lowerLength*Math.sin(bend),upperLength+lowerLength*Math.cos(bend));
    const upperDelta=Math.atan2(Math.sin(solvedUpper-restUpper),Math.cos(solvedUpper-restUpper));
    const armAngle=clamp(upperDelta,-.24,.24);
    const elbowAngle=clamp(bend-restBend,-.42,.34);
    const warpedRoot=armPoint(armRoot,elbowAngle),warpedWrist=armPoint(armWrist,elbowAngle);
    const wristVector=rotate(warpedWrist.x-warpedRoot.x,warpedWrist.y-warpedRoot.y,armAngle);
    const wristX=shoulder.x+wristVector.x,wristY=shoulder.y+wristVector.y;
    const palmAngle=clamp((armAngle+elbowAngle)*.2+motion.x*.3,-.10,.10);
    const palmOffset=rotate((.185-palmWrist.x)*(1+motion.scale),(.54-palmWrist.y)*(1+motion.scale),palmAngle);
    rig={wristX,wristY,armAngle,elbowAngle,palmAngle,palmX:wristX+palmOffset.x,palmY:wristY+palmOffset.y};
    const newNear=proximity>.2;
    if(newNear!==near){near=newNear;scene.classList.toggle('is-near',near);hint.textContent=near?'давай, я рядом ♡':'протяни ему руку';}
    paw.style.transform=`translate3d(${rig.palmX*rect.width}px,${rig.palmY*rect.height}px,0) translate(-50%,-50%) rotate(${palmAngle}rad) scale(${1+motion.scale})`;
    if(time>nextBlink){blinkStart=time;nextBlink=time+4200+Math.random()*2600;}
    const blinkAge=(time-blinkStart)/180;
    const blink=blinkAge>=0&&blinkAge<=1?Math.sin(blinkAge*Math.PI):0;
    if(render)render(time,blink);
    frame=requestAnimationFrame(animate);
  }
  const updatePointer=event=>{pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;lastPointerAt=performance.now();};
  window.addEventListener('pointermove',updatePointer,{passive:true});
  window.addEventListener('pointerdown',updatePointer,{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{pointer.active=false;});
  window.addEventListener('blur',()=>{pointer.active=false;});
  function fadePanels(outgoing, incoming, timing) {
    if (!timing.duration) return;
    const fade = { ...timing, fill: 'none' };
    outgoing.animate([{ opacity: 1 }, { opacity: 0, offset: .48 }, { opacity: 0 }], fade);
    incoming.animate([{ opacity: 0 }, { opacity: 0, offset: .16 }, { opacity: 1, offset: .86 }, { opacity: 1 }], fade);
  }
  paw.addEventListener('click',async()=>{
    if(started)return; started=true;
    cancelAnimationFrame(frame);
    clearTimeout(magicTimer);clearTimeout(titleTimer);
    scene.classList.remove('magic-nose','magic-heart','magic-years');
    document.querySelector('#magicParticles').replaceChildren();title.innerHTML=titleRest;title.classList.remove('finale-title');
    transition.hidden=false;
    const from=stage.getBoundingClientRect();
    // The same bear remains on a fixed foreground layer for the entire camera move.
    stage.classList.add('companion','has-walked');scene.append(stage);
    const to=stage.getBoundingClientRect();
    const dx=from.left-to.left,dy=from.top-to.top,scale=from.width/to.width;
    scene.classList.add('is-walking', 'journey-lit');
    intro.inert=true;
    document.querySelector('#announcement').textContent='Ты взяла мишку за лапу. Наше путешествие начинается.';
    window.dispatchEvent(new CustomEvent('anniversary:start'));paw.tabIndex=-1;
    const timing={duration:reduced.matches?0:1900,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'};
    const walking=track.animate([{transform:'translate3d(0,0,0)'},{transform:'translate3d(-100%,0,0)'}],timing);
    fadePanels(intro, transition, timing);
    const accompanying=stage.animate([{transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`},{transform:'translate3d(0,0,0) scale(1)'}],timing);
    await Promise.all([walking.finished,accompanying.finished]);
    track.style.transform='translate3d(-100%,0,0)';walking.cancel();
    accompanying.cancel();
    scene.classList.remove('is-walking');
    companionReady=true;layoutDirty=true;lastPaint=0;
    frame=requestAnimationFrame(animate);
    transition.inert=false;
    transition.focus({preventScroll:true});
  });
  journeyBack.addEventListener('click', async () => {
    if (!companionReady || transition.inert) return;
    transition.inert = true;
    cancelAnimationFrame(frame);
    const from = stage.getBoundingClientRect();
    track.style.transform = '';
    stage.classList.remove('companion');
    intro.insertBefore(stage, stageAnchor);
    const to = stage.getBoundingClientRect();
    stage.classList.add('companion');
    scene.append(stage);
    scene.classList.add('is-walking');
    scene.classList.remove('journey-lit');

    const duration = reduced.matches ? 0 : 1350;
    const timing = { duration, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'both' };
    const walking = track.animate([
      { transform: 'translate3d(-100%,0,0)' },
      { transform: 'translate3d(0,0,0)' }
    ], timing);
    fadePanels(transition, intro, timing);
    const accompanying = stage.animate([
      { transform: 'none' },
      { transform: `translate3d(${to.left - from.left}px,${to.top - from.top}px,0) scale(${to.width / from.width})` }
    ], timing);
    await Promise.all([walking.finished, accompanying.finished]);
    transition.hidden = true;
    stage.classList.remove('companion');
    intro.insertBefore(stage, stageAnchor);
    scene.classList.remove('is-walking');
    walking.cancel();
    accompanying.cancel();
    companionReady = false;
    started = false;
    intro.inert = false;
    paw.removeAttribute('tabindex');
    paw.focus({ preventScroll: true });
    layoutDirty = true;
    lastPaint = 0;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(animate);
  });
  function loadCharacter(){try{setupRenderer();}catch(error){
    console.error('Не удалось запустить анимацию мишки:',error);
    stage.dataset.renderer='fallback';stage.classList.remove('mesh-ready');render=null;
  }}
  Promise.all([image,forearmImage,pawImage,companionImage].map(asset=>asset.decode())).then(loadCharacter).catch(()=>{
    stage.classList.remove('mesh-ready');
  });
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);if(!document.hidden)frame=requestAnimationFrame(animate);});
  window.addEventListener('anniversary:garden-return', () => {
    cancelAnimationFrame(frame);
    layoutDirty = true;
    lastPaint = 0;
    frame = requestAnimationFrame(animate);
  });
  frame=requestAnimationFrame(animate);
})();
