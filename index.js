
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

/**
 * Получить список сертификатов.
 * TODO Переписать на async/await.
 * TODO Переделать выходной массив.
 */
async function getCertificates() {
	return new Promise(function (resolve, reject) {
		cadesplugin.async_spawn(function* (args) {
			try {
				const oStore = yield cadesplugin.CreateObjectAsync("CAdESCOM.Store"),
					certificateList = { count: 0, resultItems: [] };

				yield oStore.Open(
					cadesplugin.CAPICOM_CURRENT_USER_STORE,
					cadesplugin.CAPICOM_MY_STORE,
					cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

				const CertificatesObj = yield oStore.Certificates,
					cCount = yield CertificatesObj.Count;

				certificateList.count = cCount;

				for (let i = 1; i <= cCount; i++) {
					const item = yield CertificatesObj.Item(i),
						creator = yield item.GetInfo(1),
						email = yield item.GetInfo(2),
						emailSupport = yield item.GetInfo(3),
						owner = yield item.GetInfo(6),
						validFromDate = yield item.ValidFromDate,
						validToDate = yield item.ValidToDate,
						serialNumber = yield item.SerialNumber,
						subjectName = yield item.SubjectName,
						issuerName = yield item.IssuerName,
						version = yield item.Version,
						thumbprint = yield item.Thumbprint;

					certificateList.resultItems.push({
						creator: creator,
						email: email,
						emailSupport: emailSupport,
						owner: owner,
						validFromDate: validFromDate,
						validToDate: validToDate,
						serialNumber: serialNumber,
						subjectName: subjectName,
						issuerName: issuerName,
						version: version,
						thumbprint: thumbprint
					});
				}

				yield oStore.Close();

				args[0](certificateList);
			}
			catch (err) {
				args[1]("Не получилось извлечь сертификаты. Ошибка: " + cadesplugin.getLastError(err));
			}
		}, resolve, reject);
	});
}