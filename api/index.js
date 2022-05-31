import graphql from "./graphql/server";
import htmlToImage from "../lib/htmlToImage";
import puppeteer from "puppeteer";
const _ = require('lodash')
let browser;
const tpl = (pkg) => { return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;400;600&display=swap" rel="stylesheet">
    <title>${pkg.title}</title>
    <style>
      html { 
        scroll-behavior: smooth;
      }
      pre { padding: 0 }
      li a {
        text-decoration: none;
      }
      li.artist_nm {
        color:'#000,
        list-style-type: none;
        padding-bottom: 8px;
      }
      ul.versions li {
        list-style-type: none;
        margin-left: 8px;
      }
      ul.toc li {
        list-style-type: none;
        padding-bottom: 8px;
      }
      ul.toc_artist li {
        list-style-type: none;
        padding-bottom: 8px;
      }
      span {
        display: block;
        margin-top: 8px;
        font-size: 15px;
        font-weight: 400;
        font-family: "Roboto Mono", monospace;
        color: #000;
      }
      span[data-name] {
        display: inline;
        padding: 2px;
        font-size: 15px;
        font-weight: 600;
        background-color: #f8f8f8;
        font-family: "Roboto Mono", monospace;
        color: #000;
      }
      button.btn {
        margin-right: 12px;
        margin-left: 12px;
      }
      .songtitle {
        margin-left: 32px;
        font-weight: 500;
        font-size: 18px;
        margin-bottom: 20px;
      }
      body {
        margin-top: 80px;
        margin-bottom: 80px;
      }
    </style>
  </head>
  <body>
    <div class='container'>
      <nav class="navbar fixed-top navbar-light bg-light">
	      <div class="container-fluid">
	        <a class="navbar-brand" href="/toc_by_artist">List</a>
	        ${pkg.controls || ''}
	        <form class="d-flex">
            <input id="url_from_ug" class="form-control me-2" type="text" placeholder="Paste URL from UG" aria-label="URL from UG">
            <button id="get_chord_btn" class="btn btn-small btn-outline-success" type="button">Go</button>
          </form>
	      </div>
	    </nav>
      <div style="margin-top:18px; padding: 12px" id="controls"></div>
      ${pkg.main}
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.10.2/dist/umd/popper.min.js" integrity="sha384-7+zCNj/IqJ95wo16oMtfsKbZ9ccEh31eOz1HGyDuCQ6wgnyJNSYdrPa03rtR1zdB" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js" integrity="sha384-QJHtvGhmr9XOIpI6YVutG+2QOK9T+ZnN4kzFN1RtK3zEFEIsxhlmWl5/YESvpZ13" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.slim.js" integrity="sha256-HwWONEZrpuoh951cQD1ov2HUK5zA5DwJ1DNUXaM6FsY=" crossorigin="anonymous"></script>
    <script src="/main.js"></script>
    ${pkg.script}
  </body>
</html>
`};


//get all chords in listing
const get_list = async (url) => {
  const page = await browser.newPage();
  await page.goto(url, { timeout: 1000*60, waitUntil:"networkidle0"} );
  await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'})
  const songs = await page.evaluate(() => {
    let arr = []
    $("header span span a[href]").each((i,el)=>{
        let h = $(el).attr('href');
        let t = $(el).text()
        let stars = 1;
        if (h.search(/^https:\/\/tabs.ultimate-guitar.com\/tab\//)===0){
          let d = $(el).parent().parent().parent().parent()
          let sib = d.next("div");
          stars = sib.children().eq(0).children().eq(1).text()
          if (isNaN(stars)){
            stars = 0;
          }
          else{
            stars = parseInt(stars,10)
          }
        }
        arr.push({ h, t, stars })
    })

    return arr;
  });

  //now get best version of each
  songs.map(s=>{
    s.base_t = s.t.replace(/\(ver.*\)/,'').toUpperCase().trim();
    return s;
  })


  let song_groups = _.groupBy(songs,"base_t")
  for(let song in song_groups){
    song_groups[song].sort((a,b)=>{
      return a.stars > b.stars ? 1: -1;
    })
  }
  console.log(song_groups)
  return { songs, song_groups };
}

const scrape_best_in_list = async (url) => {
  let pkg = await get_list(url)
  let songs_to_fetch = []
  _.values( pkg.song_groups )
  .forEach( gg=>{
    songs_to_fetch.push( gg.pop() )
  })
  return songs_to_fetch;
}


const clean_title = t => {
  return t.replace(/@ ultimate-guitar.com/i,'').replace(/ chords$/i,'')
}

const get_chords = async (url) => {
  const page = await browser.newPage();
  await page.goto(url, {timeout:1000*60} );
  await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'})
  let title  = "Unknown";
  title = await page.evaluate(() => {
    title = window.document.title.toString().replace(/@ Ultimate-Guitar.Com/,'');
    return title;
  })
  const inner_html = await page.evaluate(() => {
    let title = window.document.title.toString();
    console.log("window.document.title.toString: " + window.document.title.toString)
    const $ = window.jQuery; //otherwise the transpiler will rename it and won't work
    const code = $('code').css("padding", "36px")
    code.prepend("<div class='songtitle'>"+title+"</div>")
    $('pre', code).css("padding", "36px")
    //$('[data-name]', code).css("color", "blue")
    return $('code').html();
  });

  return { title, html: inner_html};
}


const controls_html=`

<div class='btn-group'>
  <button id='up' type="button" class="btn btn-secondary"">Half Step Up</button>
  <button id='down' type="button" class="btn btn-secondary"">Half Step Down</button>
</div>

<div class='btn-group'>
  <button id='scroll' type="button" class="btn btn-primary">Scroll:OFF</button>
  <button id='speedDown' type="button" class="btn btn-primary">Slower</button>
  <button id='scrollSpeed' type="button" class="btn btn-primary"></button>
  <button id='speedUp' type="button" class="btn btn-primary">Faster</button>
</div>
`;

export default async (app) => {
  graphql(app);

  browser = await puppeteer.launch();

  app.use("/graphic", async (req, res) => {
    const imageBuffer = await htmlToImage(`<!-- Our HTML will go here. -->`);
    res.set("Content-Type", "image/png");
    res.send(imageBuffer);
  });

  app.use("/clean", async (req, res) => {
    return res.send(tpl({main:"<b>Not allowed<b/>", title:"Clean",script:``}))
    let rr = await app.colls.chords.remove({})
    console.log(rr);
    res.send(tpl({main:"<b>Cleared Chords<b/>", title:"Clean",script:``}))
  })

  app.use("/scrape_listing", async (req, res) => {
    let url = unescape(req.query.url);
    let ss = await scrape_best_in_list(url)
    let list = ss.map(s=>{
      return `<li>
          <span>${clean_title(s.t)}<span>
        </li>`;
    }).join("\n")

    if (app.scraping_in_process){
      let inner_html = `<p>Scraping of ${app.scraping_in_process.url} is in processs since ${app.scraping_in_process.ts.toString()}..... Try again in a few minutes.</p><ul class='fetching'>${list}</ul>`;
      res.send(tpl({main:inner_html, title:"Fetching All", script:""})) 
      return;
    }

    let inner_html = `<p>This may take several minutes.  Check Table of Contents.</p><ul class='fetching'>${list}</ul>`;
    res.send(tpl({main:inner_html, title:"Fetching All", script:""})) 

    app.scraping_in_process={
      ts: new Date(),
      url: url
    }

    await app.Promise.mapSeries( ss, async s=>{
      console.log("attempting get of " + s.h)
      let crit = { _id: s.h }
      let exist = await app.colls.chords.findOne(crit)
      if (exist){
        console.log("Found existing")
        return Promise.resolve();
      }

      let pkg;
      try{
        pkg = await get_chords(s.h)
      }catch(err){
        console.log("\nFailed getting " + s.h)
        console.error(err)
        return;
      }

      console.log("Got " + s.h)
      try {
        await app.colls.chords.insertOne({ _id: s.h, ...pkg })
      }
      catch(uerr){
        console.error(uerr)
      }
      return Promise.resolve();
    })
    delete app.scraping_in_process;

  })


  app.use("/get_listing", async (req, res) => {
    let url = unescape(req.query.url);
    let pkg = {
      song_groups: [],
      songs: []
    }

    try{
      pkg= await get_list(url)
    }catch(err){
      console.error(err)
    }

    let titles = _.keys(pkg.song_groups)
    let list = titles.map(t=>{
      let versions = pkg.song_groups[t]
      let vv = versions.map( (v,i)=>{
        return `<li><a href='/get_chords?url=${v.h}' target='ug_${v.t}'>${v.t}</a> ${(v.stars ? v.stars : '0')} stars</li>`;
      })
      let u = `<ul class='versions'>${vv.join("\n")}</ul>`;

      return `<li>
        <div>${t}</div>
        ${u}
      </li>`;
      
    }).join("\n")

    let inner_html = `<ul class='toc'>${list}</ul>`;
    let controls = `<button id='scrape_all_btn' type="button" class="btn btn-primary navbar-toggler"">
      <a title="${escape(req.query.url)}" href="/scrape_listing?url=${escape(req.query.url)}">Scrape Best Rated</a>
      </button>`;
    res.send(tpl({main:inner_html,title:"Listing", controls, script:""})) 
    return;
  });

  app.use("/get_chords", async (req, res) => {
    console.log(req.query)
    let url = "https://tabs.ultimate-guitar.com/tab/adele/when-we-were-young-chords-1782038";
    if (req.query){
      if (req.query.url){
        url = req.query.url;
      }
    }

    let crit = { _id: url }
    let exist = await app.colls.chords.findOne(crit)
    if (exist){
      console.log("Found existing")
      res.send(tpl({main:exist.html, 
        controls: controls_html,
        title: clean_title(exist.title), script:`<script src="/tune.js"></script>`}));
      return;
    }

    let pkg = {
      html : "<div>Failed getting chords</div>",
      title: "Unknown"
    }
    try{
      pkg = await get_chords(url)
    }catch(err){
      console.error(err)
    }

    try {
      await app.colls.chords.insertOne({ _id: url, ...pkg })
    }
    catch(uerr){
      console.error(uerr)
    }

    res.send(tpl({
      main:pkg.html, 
      controls: controls_html,
      script:`<script src="/tune.js"></script>`, title: clean_title(pkg.title) }));
    return;
  });

  app.use("/test", async (req, res) => {
    let url = "https://tabs.ultimate-guitar.com/tab/adele/when-we-were-young-chords-1782038";
    let html = await get(url)
    res.send(html);
  });

  app.use("/toc_by_artist", async (req, res) => {
    let ss = await app.colls.chords.find({}).sort({title:1}).toArray()
    ss = ss.map(s=>{
      let parts = s.title.split(/ by /)
      if (parts.length == 1 ) parts.push("Unknown")
      s.artist = parts[1].replace(/@/,'')
      s.title_only = clean_title(parts[0]);
      return s;
    })
    let artists = _.groupBy( ss, "artist" )


    let list = _.keys(artists)
      .sort( (a,b)=>{
        return a > b ? 1 : -1;
      })
      .map(a=>{

      let song_list = artists[a].map(s=>{
        return `<li>
            <a href='/get_chords?url=${s._id}' target='ug_${s.title}'>${s.title_only}<a>
            &nbsp;
            <a href='${s._id}' target='orig_${s.title}'>Original<a>
          </li>`;
      }).join("\n")

      return `<li><ul class='toc_artist'><li class='artist_nm'>${a}</li>${song_list}</ul><li>`; 
    }).join("\n")

    let inner_html = `<ul class='toc'>${list}</ul>`;
    res.send(tpl({main:inner_html, title:"TOC", script:""})) 
    return
  })


  app.use("/toc", async (req, res) => {
    let ss = await app.colls.chords.find({}).sort({title:1}).toArray()
    let list = ss.map(s=>{
      return `<li>
          <a href='/get_chords?url=${s._id}' target='ug_${s.title}'>${clean_title(s.title)}<a>
          &nbsp;
          <a href='${s._id}' target='${s.title}'>Original<a>
        </li>`;
    }).join("\n")
    let inner_html = `<ul class='toc'>${list}</ul>`;
    res.send(tpl({main:inner_html, title:"TOC", script:""})) 
    return
  })

  return Promise.resolve()
};
