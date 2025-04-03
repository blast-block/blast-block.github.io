
const https = require("https");
const fs = require('fs');
const path = require('path');

// Configuration
// const sitemapUrl = `https://randomlygenerator.com/server-sitemap.xml`;
const sitemapUrl = `/Users/chenxiao/Downloads/server-sitemap-4.xml`;
// const sitemapUrl = path.join(__dirname,'../public', 'sitemap-0.xml');
const siteUrl = "https://blast-block.github.io/";

const host = `${siteUrl}`; // TODO: Update
const key = '9f2f3db5a0094025bbdc6abbb3cad962'; // TODO: Update
const keyLocation = `${siteUrl}/${key}.txt`; // TODO: Update

const modifiedSinceDate = new Date(process.argv[2] || '1970-01-01');

if (isNaN(modifiedSinceDate.getTime())) {
  console.error('Invalid date provided. Please use format YYYY-MM-DD');
  process.exit(1);
}

function getFromFile(url){
    return new Promise((resolve,reject)=>{
        fs.readFile(url, 'utf-8', (err, data) => {
            if (err) {
              console.error('读取XML文件出错:', err);
              reject(err);
              return;
            }
            
            resolve(data);
            
          });
    })
}

function fetchSitemap(url) {
  return new Promise((resolve, reject) => {
    console.log(url);
    fetch(url,{
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      },
    })
    .then((response) => {
        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        resolve(response.text());
    })
    .then((data) => {
        // 处理数据
        reject(data);
    })
    .catch((error) => {
        reject(error);
    });
    
  });
}

function parseSitemap(xmlData) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlData, (err, result) => {
      if (err) {
        reject(err);
      } else {
        console.log(JSON.stringify(result));
        resolve(result);
      }
    });
  });
}

function filterUrlsByDate(sitemap, date) {
  const urls = sitemap.urlset.url;
  const newurls = []
    urls
    .filter(url => new Date(url.lastmod[0]) > date)
    .map(url => {
        // newurls.push(url.loc[0]);
        newurls.push(...url['xhtml:link'].map(ll =>(
            ll['$'].href
        )));
    });
    return newurls;
}

function postToIndexNow(urlList) {
  const data = JSON.stringify({
    host,
    key,
    urlList
  });

  const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/IndexNow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}


  function chunkArray(array, chunkSize) {  
    let result = [];  
    for (let i = 0; i < array.length; i += chunkSize) {  
        let chunk = array.slice(i, i + chunkSize);  
        result.push(chunk);  
    }  
    return result;  
}  


async function main() {
    try {
      // const xmlData = await getFromFile(sitemapUrl);
      // // const xmlData = await fetchSitemap(sitemapUrl);
      // const sitemap = await parseSitemap(xmlData);
      // const filteredUrls = filterUrlsByDate(sitemap, modifiedSinceDate);
      // console.log(filteredUrls);

      const filteredUrls = [
        'https://blast-block.github.io/blog/subway-surfers-characters-guide.html',
'https://blast-block.github.io/blog/block-blast-beginners-guide.html',
'https://blast-block.github.io/blog/block-blast-tips-and-tricks.html'

      ]
  
      if (filteredUrls.length > 0) {
        const newList = chunkArray(filteredUrls,10000);
        for(let i=0;i<newList.length;i++){
          const fuls = newList[i];
          const response = await postToIndexNow(fuls);
          console.log('IndexNow API Response:');
          console.log('Status:', response.statusCode, response.statusMessage);
          console.log('Data:', response.data);
        }
        
      } else {
        console.log('No URLs modified since the specified date.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  main();