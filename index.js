
function SignCreate(certSha1Hash, dataToSign) {
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

function run() {
	var certSha1Hash = document.getElementById("certSha1Hash").value;
	if ("" == certSha1Hash) {
		alert("Введите имя сертификата (CN).");
		return;
	}

	var oFile = document.getElementById("uploadFile").files[0];
	var oFReader = new FileReader();
	oFReader.readAsDataURL(oFile);

	oFReader.onload = function (oFREvent) {
		var header = ";base64,";
		var sFileData = oFREvent.target.result;
		var sBase64Data = sFileData.substr(sFileData.indexOf(header) + header.length);

		var thenable = SignCreate(certSha1Hash, sBase64Data);

		thenable.then(
			function (result) {
				document.getElementById("signature").innerHTML = result;
			},
			function (result) {
				document.getElementById("signature").innerHTML = result;
			});
	};

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

