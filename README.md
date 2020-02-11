
Пример создания подписи
========================

Подпись создается:  
- отсоединенной (третий аргумент функции `oSignedData.SignCades()` выставлен в `true`)
- с опцией `CADESCOM_BASE64_TO_BINARY` (можно проверить на https://14.gosuslugi.ru/pgu/eds/order)

Используется асинхронный вариант плагина.

Запуск проекта для разработки
-----------------------------

```
npm install
npm start
```

Важно!
----

Чтобы сервис https://14.gosuslugi.ru/pgu/eds/order
принял подпись, нужно обязательно файл с подписью сохранять в кодировке `UTF-8 без BOM`.
Иначе сервис выдаст Внутреннюю ошибку.

Библиотека для работы с Крипто-ПРО 4.x и Browser Plugin 2.x (cades plugin)
--------------------------------------------------

https://github.com/Aleksandr-ru/RusCryptoJS  
http://aleksandr.ru/blog/dobavlenie_subjectsigntool_v_kriptopro_ecp_browser_plug_in/  

Ссылки по теме
---------------

Проверка подписи:  
https://www.cryptopro.ru/sites/default/files/products/cades/demopage/simple.html

Создание тестовой подписи:  
https://www.cryptopro.ru/certsrv/certrqma.asp
https://www.cryptopro.ru/certsrv/
