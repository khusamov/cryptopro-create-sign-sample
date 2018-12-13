
async function run() {
	var certSha1Hash = document.getElementById("certSha1Hash").value;
	var oFile = document.getElementById("uploadFile").files[0];
	var signatureEl = document.getElementById("signature");
	signatureEl.innerHTML = '';
	if (oFile) {
		var sign = await SignCreate(certSha1Hash, oFile);
		signatureEl.innerHTML = sign;
	}
}

async function SignCreate(certSha1Hash, oFile) {
	var oCertificate = await getCertificate(certSha1Hash);

	var oSigner = await cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner");
	await oSigner.propset_Certificate(oCertificate);

	var oSignedData = await cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
	await oSignedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
	await oSignedData.propset_Content(await fileToBase64(oFile));

	var sSignedMessage = await oSignedData.SignCades(oSigner, cadesplugin.CADESCOM_CADES_BES, true);
	return sSignedMessage;
}

function saveSign() {
	var oFile = document.getElementById("uploadFile").files[0];
	if (oFile) {
		saveAs(
			new Blob(
				[document.getElementById("signature").innerHTML],
				{ type: "text/plain;charset=utf-8" }
			),
			`${oFile.name}.sig`
		);
		saveAs(oFile, `${oFile.name}.COPY.pdf`);
	}
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