import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const partnersPath = path.join(root, "docs/partners/index.html");
const indexPath = path.join(root, "docs/index.html");

let html = fs.readFileSync(partnersPath, "utf8");
const indexHtml = fs.readFileSync(indexPath, "utf8");

const headerMatch = indexHtml.match(/<header class="border-b[\s\S]*?<\/header>/);
if (!headerMatch) throw new Error("header not found in index.html");

let header = headerMatch[0].replace(
  'href="/solarsite2020/partners/" class="nav-link"',
  'href="/solarsite2020/partners/" class="nav-link nav-link-active"',
);

html = html.replace(/<header class="border-b[\s\S]*?<\/header>/, header);

html = html.replace(
  /<title>[^<]*<\/title>/,
  "<title>合作藝術家 partners — 索拉舞蹈空間舞團</title>",
);

html = html.replace(
  /<h2 class="partners-section-title"><span class="text-xl">[^<]*<\/span> <span class="text-lg font-normal">Member<\/span><\/h2>/,
  '<h2 class="partners-section-title"><span class="text-xl">人員簡介</span> <span class="text-lg font-normal">Member</span></h2>',
);

html = html.replace(
  /<h2 class="partners-section-title">[^<]*&nbsp; Artists\/Dancers<\/h2>/,
  '<h2 class="partners-section-title">歷年合作藝術家&nbsp; Artists/Dancers</h2>',
);

html = html.replace(
  /<h2 class="partners-section-title partners-section-title--sub">[^<]* &nbsp;Dancers<\/h2>/,
  '<h2 class="partners-section-title partners-section-title--sub">合作舞者 &nbsp;Dancers</h2>',
);

html = html.replace(
  /(3265676\.jpg" alt=")[^"]*(")/,
  "$1&#28504;&#22823;&#35609;$2",
);
html = html.replace(
  /(7427535\.jpg" alt=")[^"]*(")/,
  "$1&#31243;&#26313;&#23888;$2",
);
html = html.replace(
  /(1398500\.jpg" alt=")[^"]*(")/,
  "$1&#26954;&#28113;&#33775;$2",
);
html = html.replace(
  /(1\.jpg" alt=")[^"]*(")/,
  "$1&#21129;&#35565;&#33841;$2",
);

const thanksBlock = `        <section class="partners-thanks mt-12">
          <p class="partners-thanks-intro"><strong>&#24863;&#35613;&#25152;&#26377;&#26366;&#32147;&#21443;&#33287;&#32034;&#25289;&#28436;&#20986;&#30340;&#22821;&#20276;&#20497;&#65306; </strong></p>
          <div class="partners-thanks-years">
            <p><span class="year">2017</span>&#33707;&#31310;&#35433;&#12289;&#38515;&#33437;&#34271;&#12289;&#21555;&#23391;&#29642;&#12289;&#24373;&#37323;&#20998;&#12289;&#38515;&#39013;&#20161;&#12289;&#38991;&#21487;&#33589;</p>
            <p><span class="year">2016</span>&#26446;&#22862;&#37586;&#12289;&#33865;&#20329;&#29618;</p>
            <p><span class="year">2015</span>&#33865;&#20329;&#29618;</p>
            <p><span class="year">2014</span>&#38515;&#35997;&#29788;&#12289;&#26446;&#26313;&#23159;&#12289;&#38515;&#24184;&#22937;</p>
            <p><span class="year">2013</span>&#31243;&#39336;&#24935;&#12289;&#34311;&#32946;&#33459;</p>
            <p><span class="year">2012</span>&#38515;&#24184;&#22937;&#12289;&#32993;&#39336;&#23609;&#12289;&#34083;&#20110;&#33673;&#12289;&#31243;&#39336;&#24935;&#12289;&#34311;&#32946;&#33459;&#12289;&#29579;&#26313;&#34349;&#12289;&#32705;&#38748;&#21535;&#12289;&#38515;&#20432;&#21531;&#12289;&#36032;&#24859;&#26366;&#12289;&#26519;&#21697;&#25215;</p>
            <p><span class="year">2011</span>&#38515;&#24184;&#22937;&#12289;&#32993;&#39336;&#23609;&#12289;&#34083;&#20110;&#33673;&#12289;&#34311;&#32946;&#33459;&#12289;&#38515;&#20432;&#21531;&#12289;&#36032;&#24859;&#26366;&#12289;&#26519;&#21697;&#25215;&#12289;&#34081;&#39336;&#29801;&#12289;&#39640;&#26313;&#33841;</p>
            <p><span class="year">2010</span>&#21331;&#38597;&#24800;&#12289;&#38515;&#24184;&#22937;&#12289;&#34083;&#20110;&#33673;&#12289;&#32993;&#39336;&#23609;&#12289;&#34311;&#32946;&#33459;&#12289;&#39640;&#26313;&#33841;&#12289;&#37101;&#27427;&#31310;&#12289;&#34311;&#32057;&#26126;&#12289;&#35377;&#38597;&#23159;&#12289;&#21555;&#38748;&#38639;&#12289;&#26519;&#23029;&#34722;&#12289;&#40643;&#22686;&#23460;</p>
            <p><span class="year">2009</span>&#21331;&#38597;&#24800;&#12289;&#35377;&#29898;&#33775;&#12289;&#33865;&#20142;&#20278;&#12289;&#38515;&#24184;&#22937;&#12289;&#34083;&#20110;&#33673;&#12289;&#32993;&#39336;&#23609;&#12289;&#34311;&#32057;&#26126;&#12289;&#37758;&#29771;&#32020;&#12289;&#21555;&#38748;&#38639;</p>
            <p><span class="year">2008</span>&#27946;&#27603;&#23125;&#12289;&#34311;&#32057;&#26126;&#12289;&#35377;&#38597;&#23159;&#12289;&#26446;&#26228;&#26228;&#12289;&#38867;&#33449;</p>
            <p><span class="year">2007</span>&#27946;&#27603;&#23125;&#12289;&#26446;&#20339;&#29618;&#12289;&#26954;&#28113;&#33775;&#12289;&#35377;&#25935;&#23481;&#12289;&#35377;&#38597;&#23159;</p>
          </div>
        </section>`;

html = html.replace(
  /<section class="partners-thanks mt-12">[\s\S]*?<\/section>\s*(?=\n\s*<\/div>)/,
  thanksBlock,
);

const checks = [
  "主選單",
  "最新消息",
  "人員簡介",
  "歷年合作藝術家",
  "合作舞者",
  "合作藝術家 partners — 索拉舞蹈空間舞團",
  "&#24863;&#35613;",
  "1398500.jpg",
];
for (const c of checks) {
  if (!html.includes(c)) throw new Error(`missing after fix: ${c}`);
}

fs.writeFileSync(partnersPath, html, { encoding: "utf8" });
console.log("Wrote UTF-8:", partnersPath);
