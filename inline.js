let inline = require('inline-source').sync
  , fs = require('fs')
  , path = require('path');

fs.readFile('build/asset-manifest.json', 'utf8', function (err, data) {
  let manifest = JSON.parse(data);
  fs.readFile('build/index.html', 'utf8', function (err, data) {
    let main_css = manifest["main.css"];
    let main_js = manifest["main.js"];

    data = data.replace(main_css+'"', main_css+'" inline');
    data = data.replace(main_js+'"', main_js+'" inline');

    let html = inline(data, {
      compress: true,
      rootpath: path.resolve('build'),
    });

    console.log(html);

  });
});




