const map = {
    up : {
    "A": "Bb",
    "B": "C",
    "C": "C#",
    "D": "D#",
    "E": "F",
    "F": "F#",
    "G": "G#",

    "A#": "B",
    "B#": "C#",
    "C#": "D",
    "D#": "E",
    "E#": "F#",
    "F#": "G",
    "G#": "A",

    "Ab": "A",
    "Bb": "B",
    "Cb": "C",
    "Db": "D",
    "Eb": "E",
    "Fb": "F",
    "Gb": "G"
  } , 
  down: {
    "A": "Ab",
    "B": "Bb",
    "C": "B",
    "D": "Db",
    "E": "Eb",
    "F": "E",
    "G": "F#",

    "A#": "A",
    "B#": "B",
    "C#": "C",
    "D#": "D",
    "E#": "E",
    "F#": "F",
    "G#": "G",

    "Ab": "G",
    "Bb": "A",
    "Cb": "Bb",
    "Db": "C",
    "Eb": "D",
    "Fb": "Eb",
    "Gb": "F"
  } 
}

function upstep(){ step('up') }
function downstep(){ step('down') }
function step(way){
  jQuery("span[data-name]").each(function(idx,el){
    var chord =  jQuery(el).text().trim();
    console.log("old:",chord);
    var mm = chord.match( /[A-G][#b]{0,1}/g );
    mm.forEach(function(m){
      chord = chord.replace(m, map[way][m]);
    });
    console.log("new:",chord);
    jQuery(el).text(chord);
  });
}

window.data = { 
  on:false,
  scrollTo: 1,
  dial_pos: 8,
  dials: [
    {size:1, delay: 110},
    {size:1, delay: 95},
    {size:1, delay: 80},
    {size:1, delay: 65},
    {size:1, delay: 50},
    {size:1, delay: 35},
    {size:1, delay: 10},
    {size:2, delay: 50},
    {size:2, delay: 40},
    {size:2, delay: 30},
    {size:2, delay: 20},
    {size:2, delay: 10},
    {size:2, delay: 1 },
    {size:3, delay: 50},
    {size:3, delay: 40},
    {size:3, delay: 30},
    {size:3, delay: 20},
    {size:3, delay: 10},
    {size:3, delay: 1 }
  ]
}

function scroll() {
  //let h = $(document).height();
  //let pixels = Math.floor(h/n) * window.data.scrolls;
  
  //$(document).scrollTop(pixels)
  if (window.data.on===false) return;

  if (window.data.scrollTo > window.data.maxScrollY) {
    console.log("At max scroll Y")
    window.data.on=false;
    jQuery("#scroll").text("Scroll is:OFF")
    return 
  }

  window.data.timer = setTimeout( ()=>{
    console.log("scrolling to ", window.data.scrollTo)
    window.scrollTo({ top:window.data.scrollTo, behavior: 'smooth' })
    window.data.scrollTo+=window.data.dials[window.data.dial_pos].size;
    return scroll()
  }, window.data.dials[ window.data.dial_pos ].delay )
}

function scrollOff(){
  clearTimeout( window.data.timer )
  window.data.on=false;
  jQuery("#scroll").text("Scroll is:OFF")
  return;
}

function scrollToggle(){
  if (window.data.on) {
    return scrollOff();
  }

  window.data.scrollTo = (window.scrollY*1);
  window.data.on=true;
  jQuery("#scroll").text("Scroll is:ON")
  scroll();
  return;
}

function scrollDial(inc){
  if ( 
    (window.data.dial_pos+inc) > window.data.dials.length 
    ||
    (window.data.dial_pos+inc) < 0
  ){
    return;
  }

  window.data.dial_pos+=inc;
  jQuery("#scrollSpeed").text((window.data.dial_pos+1))
}

function scrollUp(){
  scrollOff();
  scrollDial(1)
}
function scrollDown(){
  scrollOff();
  scrollDial(-1)
}

function ab(){
  let upbtn= jQuery(`<button type="button" class="btn btn-primary">Half Step Up</button>`);
  let downbtn = jQuery(`<button type="button" class="btn btn-primary">Half Step Down</button>`);
  let sbtn = jQuery("<button type='button' class='btn btn-secondary'>Scroll</button>");
  let sec = jQuery("<input value='30' id='seconds'/>");
  let tbl = jQuery( "<div style='border: 1px solid #000; width:100%'><table style='width: 90%;'><tr> <td style='width: 33%;padding-right: 10px;border-right: 1px solid #000' id='col1'></td> <td style='width: 33%; padding-right: 10px;border-right: 1px solid #000;' id='col2'></td> <td style='width:33%;' id='col3'></td></tr></table><div id='chord'></div></div>" );

  window.data.maxScrollY = $("pre").eq(0).height() - window.innerHeight + 280;

  jQuery("#down").bind("click", downstep);
  jQuery("#up").bind("click", upstep);
  jQuery("#scroll").bind("click", scrollToggle);

  jQuery("#speedUp").bind("click", scrollUp)
  jQuery("#speedDown").bind("click", scrollDown)
  jQuery("#scrollSpeed").text((window.data.dial_pos+1) );

  //sbtn.bind("click", scroll);
  console.log("ab done");
}

jQuery( document ).ready(function() {
  ab() 
});



