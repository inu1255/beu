#!/usr/bin/env node
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

function walk(dir, cb) {
	return new Promise(function (resolve, reject) {
		let pms = Promise.resolve();
		fs.readdir(dir, function (err, files) {
			if (err) return reject(err);
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				((file) =>
					(pms = pms.then(
						() =>
							new Promise(function (resolve, reject) {
								fs.stat(file, function (err, stat) {
									if (err) return reject(err);
									if (stat.isDirectory()) resolve(walk(file, cb));
									else resolve(cb(file, stat));
								});
							})
					)))(dir + "/" + file);
			}
			pms.then(resolve, reject);
		});
	});
}

async function beu(dir, url, freq) {
	let map = {};
	let ignore = {
		"/files.json": true,
		"/manifest.json": true,
		"/sw-install.js": true,
		"/sw.js": true,
	};
	if (!(await fs.exists(dir))) throw `dir ${dir} not exists`;
	if (!/^https?:\/\//.test(url)) throw `url must startsWith http/https ${url}`;
	if (!/^\d+$/.test(freq)) throw `freq must be a number`;
	if (url.endsWith("/")) url = url.slice(0, -1);
	if (dir.endsWith("/")) dir = dir.slice(0, -1);
	let data = await fs.readFile(dir + "/manifest.json");
	let m = JSON.parse(data);
	let script = '<script src="/sw-install.js"></script>';
	if (m.background) {
		if (m.background.scripts) {
			m.background.scripts.push("sw-install.js");
		} else if (m.background.page) {
			let file = dir + "/" + m.background.page;
			let data = await fs.readFile(file, "utf8");
			if (data.indexOf(script) < 0) {
				data = data.replace("<body>", "<body>" + script);
				await fs.writeFile(file, data);
			}
		}
		if (m.browser_action && m.browser_action.default_popup) {
			let file = dir + "/" + m.browser_action.default_popup;
			let data = await fs.readFile(file, "utf8");
			if (data.indexOf(script) < 0) {
				data = data.replace("<body>", "<body>" + script);
				await fs.writeFile(file, data);
			}
		}
		if (m.devtools_page) {
			let file = dir + "/" + m.devtools_page;
			let data = await fs.readFile(file, "utf8");
			if (data.indexOf(script) < 0) {
				data = data.replace("<body>", "<body>" + script);
				await fs.writeFile(file, data);
			}
		}
		if (m.options_page) {
			let file = dir + "/" + m.options_page;
			let data = await fs.readFile(file, "utf8");
			if (data.indexOf(script) < 0) {
				data = data.replace("<body>", "<body>" + script);
				await fs.writeFile(file, data);
			}
		} else if (m.options_ui && m.options_ui.page) {
			let file = dir + "/" + m.options_ui.page;
			let data = await fs.readFile(file, "utf8");
			if (data.indexOf(script) < 0) {
				data = data.replace("<body>", "<body>" + script);
				await fs.writeFile(file, data);
			}
		}
	}
	data = await fs.readFile(__dirname + "/sw.js");
	var idx = data.indexOf("// ----- change above -----");
	data = `const UPDATE_URL = ${JSON.stringify(url)};\nconst UPDATE_FREQ = ${freq}; // 检查更新间隔\n` + data.slice(idx);
	await fs.writeFile(dir + "/sw.js", data);
	data = await fs.readFile(__dirname + "/sw-install.js");
	await fs.writeFile(dir + "/sw-install.js", data);
	await walk(dir, function (file) {
		let key = file.slice(dir.length);
		if (ignore[key] || key.indexOf("/.") >= 0) return;
		return new Promise(function (resolve, reject) {
			fs.readFile(file, function (err, data) {
				if (err) return reject(err);
				map[key] = crypto.createHash("md5").update(data).digest("hex");
				resolve();
			});
		});
	});
	await fs.writeFile(path.join(dir, "files.json"), JSON.stringify(map, null, 2));
	return map;
}

let dir = process.argv[2];
let url = process.argv[3];
let freq = process.argv[4];
if (dir && url) {
	beu(dir, url, (freq || 1800) * 1e3).then(
		() => console.log("success"),
		(err) => {
			console.error(err);
			usage();
		}
	);
} else {
	usage();
}

function usage() {
	console.log(`usage:`);
	console.log(`	beu <extention dir> <update url> [update freq(seconds)=1800]`);
	console.log(`example:`);
	console.log(`	beu build http:// <update freq(seconds)>`);
}
