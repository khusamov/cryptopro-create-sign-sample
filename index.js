
async function run() {
	var certSha1Hash = document.getElementById("certSha1Hash").value;
	var oFile = document.getElementById("uploadFile").files[0];

	var sBase64Data = await fileToBase64(oFile);
	var sign = await SignCreate(certSha1Hash, sBase64Data);
	document.getElementById("signature").innerHTML = sign;
}

async function SignCreate(certSha1Hash, dataToSign) {
	return new Promise(function (resolve, reject) {
		cadesplugin.async_spawn(function* (args) {
			try {
				var oCertificate = yield getCertificate(certSha1Hash);

				var oSigner = yield cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner");
				yield oSigner.propset_Certificate(oCertificate);

				var oSignedData = yield cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
				yield oSignedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
				yield oSignedData.propset_Content(dataToSign);

				var sSignedMessage = yield oSignedData.SignCades(oSigner, cadesplugin.CADESCOM_CADES_BES, true);

				args[2](sSignedMessage);
			}
			catch (err) {
				console.error(err);
				args[3]("Failed to create signature. Error: " + cadesplugin.getLastError(err));
			}
		}, certSha1Hash, dataToSign, resolve, reject);
	});
}

function saveSign() {
	var oFile = document.getElementById("uploadFile").files[0];
	saveAs(new Blob([document.getElementById("signature").innerHTML], {type: "text/plain;charset=utf-8"}), `${oFile.name}.sig`);
}

async function fileToBase64(oFile) {
	const fileReader = new FileReader();
	await fileReader.readAsDataURL(oFile);
	return new Promise(resolve => {
		fileReader.onload = function (fileReaderEvent) {
			const header = ";base64,";
			const sFileData = fileReaderEvent.target.result;
			resolve(sFileData.substr(sFileData.indexOf(header) + header.length));
		};
	});
}

async function getCertificate(criterionValue, findType = cadesplugin.CAPICOM_CERTIFICATE_FIND_SHA1_HASH) {
	const oStore = await cadesplugin.CreateObjectAsync("CAdESCOM.Store");
	await oStore.Open(
		cadesplugin.CAPICOM_CURRENT_USER_STORE,
		cadesplugin.CAPICOM_MY_STORE,
		cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
	);
	const certificatesObj = await oStore.Certificates;
	const oCertificates = await certificatesObj.Find(findType, criterionValue);
	const oCertificatesCount = await oCertificates.Count;
	if (oCertificatesCount === 0) {
		throw new Error(`Не найден сертификат '${criterionValue}'`);
	}
	await oStore.Close();
	return oCertificates.Item(1);
}