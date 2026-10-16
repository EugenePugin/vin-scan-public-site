# Vin-Scan

Публичный сайт сервиса: https://vin-scan.ru

## Логотип компании

Логотипы компании лежат в папке [img/](img/).

## Деплой

Для деплоя используется [deploy.yml](.github/workflows/deploy.yml) (шаг `deploy`, происходящий при успешном выполнении шага `validate`, о котором см. ниже).

## Форматирование и валидация HTML

Для форматирования используется [.gitattributes](.gitattributes) и [.editorconfig](.editorconfig) ([auto-format.yml](.github/workflows/auto-format.yml) создаёт дополнительный коммит `style: auto-format via '.editorconfig'` при необходимости, подробнее на [editorconfig.org](https://editorconfig.org/)).

Для валидации HTML реализуется через шаг `validate` в [deploy.yml](.github/workflows/deploy.yml), блокирующей push / PR в случае ошибок вёрстки (подробнее [html-validate](https://html-validate.org/)).

Валидатор отклоняет пуш или PR в следующих случаях:
- не закрыты или некорректно вложены теги
- нарушена базовая структура HTML-документа
- использованы inline-стили через атрибут `style="..."`
- использованы блоки стилей через тег `<style>...</style>`

Конфигурация проверки находится в `.htmlvalidate.json`.

Запустить проверку локально можно командой:

```sh
npx --yes html-validate@11.16.2 "**/*.html"
```

## Яндекс Метрика

Счётчик Яндекс Метрики вынесен в отдельный файл `js/metrika.js` и подключается в секции `<head>` одной строкой:

```html
<script src="/js/metrika.js" defer></script>
```
