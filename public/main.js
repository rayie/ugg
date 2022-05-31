function onland(){

  jQuery("#get_chord_btn").unbind("click").bind("click", ()=>{
    let url = jQuery("#url_from_ug").val()
    if (url.search(/ultimate-guitar.com\/artist/i)!==-1){
      console.log("here")
      window.open("/get_listing?url="+escape(url),"_new_list")
      return;
    }
    return window.open("/get_chords?url="+url,"_new_song")
  })

}

jQuery( document ).ready(function() {
  onland()
});

