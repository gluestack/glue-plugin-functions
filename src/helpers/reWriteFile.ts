import fs from 'fs';
import util from 'util';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Replaces file's content with the given database name
const reWriteFile = async (filePath: string, instanceName: string, defaultVar = 'functions') => {
	return new Promise(async (resolve, reject) => {
		try {
			let data = await readFile(filePath, "utf8");
			data = data.replaceAll(defaultVar, instanceName);

			await writeFile(filePath, data);
			resolve('done');
		} catch (err) {
			reject(err)
		}
	})
}

export default reWriteFile
