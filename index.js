
function SignCreate(certSubjectName, dataToSign) {
	return new Promise(function (resolve, reject) {
		cadesplugin.async_spawn(function* (args) {
			try {
				var oStore = yield cadesplugin.CreateObjectAsync("CAdESCOM.Store");
				yield oStore.Open(cadesplugin.CAPICOM_CURRENT_USER_STORE, cadesplugin.CAPICOM_MY_STORE,
					cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);


				var CertificatesObj = yield oStore.Certificates;
				var oCertificates = yield CertificatesObj.Find(
					cadesplugin.CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME, certSubjectName);

				var Count = yield oCertificates.Count;
				if (Count == 0) {
					throw ("Certificate not found: " + args[0]);
				}
				var oCertificate = yield oCertificates.Item(1);
				var oSigner = yield cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner");
				yield oSigner.propset_Certificate(oCertificate);

				var oSignedData = yield cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
				yield oSignedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
				yield oSignedData.propset_Content(dataToSign);

				var sSignedMessage = yield oSignedData.SignCades(oSigner, cadesplugin.CADESCOM_CADES_BES, true);

				yield oStore.Close();

				args[2](sSignedMessage);
			}
			catch (err) {
				console.error(err);
				args[3]("Failed to create signature. Error: " + cadesplugin.getLastError(err));
			}
		}, certSubjectName, dataToSign, resolve, reject);
	});
}

function run() {
	var oCertName = document.getElementById("CertName");
	var sCertName = oCertName.value;
	if ("" == sCertName) {
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

		var thenable = SignCreate(sCertName, sBase64Data);

		thenable.then(
			function (result) {
				document.getElementById("signature").innerHTML = result;
			},
			function (result) {
				document.getElementById("signature").innerHTML = result;
			});
	};

}
