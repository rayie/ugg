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

function scroll() {
  let element = jQuery("body");
  let seconds = parseInt( jQuery("#seconds").val(), 10 );
  let speed=1000*60*seconds;
  console.log("Scrolling over " + speed + " seconds");
  element.animate({ scrollTop: $(document).height() }, speed,'linear', function() {
    $(this).animate({ scrollTop: 0 }, speed, 'linear', scroll(element, speed));
  });

}

function ab(){
  let upbtn= jQuery(`<button type="button" class="btn btn-primary">Half Step Up</button>`);
  let downbtn = jQuery(`<button type="button" class="btn btn-primary">Half Step Down</button>`);
  let sbtn = jQuery("<button type='button' class='btn btn-secondary'>Scroll</button>");
  let sec = jQuery("<input value='30' id='seconds'/>");
  let tbl = jQuery( "<div style='border: 1px solid #000; width:100%'><table style='width: 90%;'><tr> <td style='width: 33%;padding-right: 10px;border-right: 1px solid #000' id='col1'></td> <td style='width: 33%; padding-right: 10px;border-right: 1px solid #000;' id='col2'></td> <td style='width:33%;' id='col3'></td></tr></table><div id='chord'></div></div>" );


  jQuery("#down").bind("click", downstep);
  jQuery("#up").bind("click", upstep);
  //sbtn.bind("click", scroll);
  console.log("ab done");
}

jQuery( document ).ready(function() {
  ab() 
});



